import { AppRouter } from "@/trpc";
import { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;

// infer type from trpc router
type Messages = RouterOutput["getFileMessages"]["messages"]

type OmitText = Omit<Messages[number], "text">

type ExtendedText = {
    text: string | JSX.Element
}

export type ExtendedMessage = OmitText & ExtendedText