import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { db } from "@/db";
 
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
      const createdFile = await db.file.create({ 
        data: { 
          key: file.key, name: file.name, userId: metadata.userId, url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`, uploadStatus: 'PROCESSING'
        }
      })
 
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;