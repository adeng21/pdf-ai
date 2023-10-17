import { Document, Page } from "react-pdf";
import { Loader2 } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { cn } from "@/lib/utils";
interface PdfDocumentProps {
  currentPage: number;
  scale: number;
  rotation: number;
  url: string;
  width: number | undefined;
  setNumPages: (numPages: number) => void;
  isLoading: boolean;
  renderedScale: number | null;
  setRenderedScale: (scale: number) => void;
}

const PdfDocument = ({
  currentPage,
  scale,
  rotation,
  url,
  width,
  setNumPages,
  isLoading,
  renderedScale,
  setRenderedScale,
}: PdfDocumentProps) => {
  const { toast } = useToast();
  return (
    <Document
      loading={
        <div className="flex justify-center">
          <Loader2 className="my-24 h-6 w-6 animate-spin" />
        </div>
      }
      onLoadError={() => {
        toast({
          title: "Error loading PDF",
          description: "Please try again later",
          variant: "destructive",
        });
      }}
      onLoadSuccess={({ numPages }) => {
        setNumPages(numPages);
      }}
      file={url}
      className="max-h-full"
    >
      {isLoading && renderedScale ? (
        <Page
          width={width ? width : 1}
          pageNumber={currentPage}
          scale={scale}
          rotate={rotation}
          key={"@" + renderedScale}
        />
      ) : null}
      <Page
        width={width ? width : 1}
        className={cn(isLoading ? "hidden" : "")}
        pageNumber={currentPage}
        scale={scale}
        rotate={rotation}
        key={"@" + scale}
        loading={
          <div className="flex justify-center">
            <Loader2 className="my-24 h-6 w-6 animate-spin" />
          </div>
        }
        onRenderSuccess={() => {
          setRenderedScale(scale);
        }}
      />
    </Document>
  );
};
export default PdfDocument;
