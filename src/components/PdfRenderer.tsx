"use client";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useToast } from "./ui/use-toast";
import { useResizeDetector } from "react-resize-detector";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { set } from "date-fns";

interface PdfRendererProps {
  url: string;
}
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

const PdfRenderer = ({ url }: PdfRendererProps) => {
  const { toast } = useToast();
  const { width, ref } = useResizeDetector();
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  return (
    <div className="w-full rounded-md bg-white shadow flex flex-col items-center">
      <div className="h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            disabled={currentPage <= 1}
            aria-label="previous page"
            onClick={() => {
              setCurrentPage((prev) => {
                return prev - 1 > 1 ? prev - 1 : 1;
              });
            }}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1.5">
            <Input className="w-12 h-8" />
            <p className="text-zinc-700 text-sm space-x-1">
              <span>/</span>
              <span>{numPages ?? "x"}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            aria-label="next page"
            disabled={numPages === undefined || currentPage === numPages}
            onClick={() => {
              setCurrentPage((prev) => {
                return prev + 1 <= numPages ? prev + 1 : prev;
              });
            }}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 w-full max-h-screen">
        <div ref={ref}>
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
            <Page width={width ? width : 1} pageNumber={currentPage} />
          </Document>
        </div>
      </div>
    </div>
  );
};
export default PdfRenderer;
