import { Document, Page } from "react-pdf";
import { Loader2 } from "lucide-react";
import { useToast } from "./ui/use-toast";
interface PdfDocumentProps {
  currentPage: number;
  scale: number;
  rotation: number;
  url: string;
  width: number | undefined;
  setNumPages: (numPages: number) => void;
}

const PdfDocument = ({
  currentPage,
  scale,
  rotation,
  url,
  width,
  setNumPages,
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
      <Page
        width={width ? width : 1}
        pageNumber={currentPage}
        scale={scale}
        rotate={rotation}
      />
    </Document>
  );
};
export default PdfDocument;
