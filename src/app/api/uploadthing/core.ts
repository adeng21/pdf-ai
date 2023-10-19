import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { db } from "@/db";
import {PDFLoader} from "langchain/document_loaders/fs/pdf"
import  pinecone from "@/lib/pinecone";
import {OpenAIEmbeddings} from "langchain/embeddings/openai"
import {PineconeStore} from "langchain/vectorstores/pinecone"
 
const f = createUploadthing();
 
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })

    .middleware(async ({ req }) => {
      // This code runs on your server before upload
    //   const user = await auth(req);
    const { getUser } = getKindeServerSession()
    const user = getUser()
    if (!user || !user.id) throw new Error("Unauthorized");
 
 
      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      //metadata returns from middleware
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      const fileUrl = `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`
      const createdFile = await db.file.create({ 
        data: { 
          key: file.key, name: file.name, userId: metadata.userId, url: fileUrl, uploadStatus: 'PROCESSING'
        }
      })
      // index pdf file in vector database (pinecone) for AI response later
      try {
        const response = await fetch(fileUrl)
        const blob = await response.blob()

        // use langchain to load pdf
        const loader = new PDFLoader(blob)

        const pageLevelDocs = await loader.load()

        const pagesAmt = pageLevelDocs.length
        
        // vectorize and index entire document

        const pineconeIndex = pinecone.Index('ai-musings') // matches index created in pinecone
        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
        })

        await PineconeStore.fromDocuments(
          pageLevelDocs, 
          embeddings, {
            pineconeIndex,
            // namespace: createdFile.id namespace not available on free plan so disabling it for now
          }
        )


        await db.file.update({data: {uploadStatus: 'SUCCESS'}, where: {id: createdFile.id }})

      } catch (err){
        console.log(err)
        await db.file.update({data: {uploadStatus: 'FAILED'}, where: {id: createdFile.id }})

      }
 
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;