
import { NextRequest } from "next/server"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator"
import { db } from "@/db"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import pinecone from "@/lib/pinecone"
import { PineconeStore } from "langchain/vectorstores/pinecone"
import openai from "@/lib/openai"
import {OpenAIStream, StreamingTextResponse } from 'ai'

export const POST = async (req: NextRequest) => {
    // endpoint for asking a question to a pdf file
    const body = await req.json()
    const {getUser} = getKindeServerSession()   
    const user = getUser()

    const {id: userId} = user

    if(!userId) return new Response("Unauthorized", {status: 401})  

    const {fileId, message} = SendMessageValidator.parse(body)

    const file = await db.file.findFirst({where: {id: fileId, userId}})
    
    if(!file) return new Response('Not found', {status: 404})

    await db.message.create({data: {fileId, text: message, isUserMessage: true, userId}})

    // index pdf file, search for closest query
    // AI response

    //1: vectorize message
    const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
    })

    const pineconeIndex = pinecone.Index('ai-musings') // matches index created in pinecone

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {pineconeIndex})
    
    const results = await vectorStore.similaritySearch(message, 4) // return number of messages that are closest to the query

    const prevMessages = await db.message.findMany({
        where: {
            fileId,
        },
        orderBy: {
            createdAt: 'asc'
        },
        take: 6 // arbitrary number
    })
    
    //2: send messages to openai

    const formattedMessages = prevMessages.map(message => ({
        role: message.isUserMessage ? 'user' as const : 'assistant' as const,
        content: message.text
    }))

    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        temperature: 0,
        stream: true,
        messages: [ //prompt to openai
            {
                role: 'system',
                content:
                  'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
              },
            {
                role: 'user',
                content:`Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
                \n----------------\n
                
                PREVIOUS CONVERSATION:
                ${formattedMessages.map((message) => {
                  if (message.role === 'user')
                    return `User: ${message.content}\n`
                  return `Assistant: ${message.content}\n`
                })}
                
                \n----------------\n
                
                CONTEXT:
                ${results.map((r) => r.pageContent).join('\n\n')}
                
                USER INPUT: ${message}`

            }
        ]
    })


    const stream = OpenAIStream(response, {
        async onCompletion(completion) {
            await db.message.create({data: {text: completion, isUserMessage: false, fileId, userId}})
        }
    })

    // just returned the stream
    return new StreamingTextResponse(stream)

}