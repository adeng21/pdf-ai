"use client";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCw,
  Search,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useResizeDetector } from "react-resize-detector";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { set } from "date-fns";
import { number } from "zod";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "./ui/dropdown-menu";
import Simplebar from "simplebar-react";
import PdfFullscreen from "./PdfFullscreen";
import PdfDocument from "./PdfDocument";

interface PdfRendererProps {
  url: string;
}
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

const PdfRenderer = ({ url }: PdfRendererProps) => {
  const { width, ref } = useResizeDetector(); // library to resize pdf to fit container
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // validate page number
  const CustomPageValidator = z.object({
    page: z
      .string()
      .refine((val) => Number(val) > 0 && Number(val) <= numPages!),
  });

  type TCustomPageValidator = z.infer<typeof CustomPageValidator>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TCustomPageValidator>({
    defaultValues: {
      page: "1",
    },
    resolver: zodResolver(CustomPageValidator), // this resolver links the validator to the form
  });

  const handlePageSubmit = ({ page }: TCustomPageValidator) => {
    setCurrentPage(Number(page));
    setValue("page", String(page));
  };
  const goBackPage = (page: number) => {
    return page - 1 > 1 ? page - 1 : 1;
  };
  const goNextPage = (page: number) => {
    return page + 1 <= numPages ? page + 1 : page;
  };

  return (
    <div className="w-full rounded-md bg-white shadow flex flex-col items-center">
      <div className="h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            disabled={currentPage <= 1}
            aria-label="previous page"
            onClick={() => {
              setCurrentPage((prev) => goBackPage(prev));
              setValue("page", String(goBackPage(currentPage)));
            }}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1.5">
            <Input
              {...register("page")} // this library handles the input value updates
              className={cn(
                "w-12 h-8",
                errors.page && "focus-visible:ring-red-500"
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(handlePageSubmit)();
                }
              }}
            />
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
              setCurrentPage((prev) => goNextPage(prev));
              setValue("page", String(goNextPage(currentPage)));
            }}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* // asChild is used so there's no two triggers */}
              <Button className="gap-1.5" aria-label="zoom" variant="ghost">
                <Search className="h-4 w-4" />
                {scale * 100}% <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setScale(1)}>
                100%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(1.5)}>
                150%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(2)}>
                200%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(2.5)}>
                250%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(3)}>
                300%
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            aria-label="rotate 90 degrees"
            variant="ghost"
            onClick={() => {
              setRotation((prev) => prev + 90);
            }}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <PdfFullscreen fileUrl={url} />
        </div>
      </div>

      {/* PDF document */}

      <div className="flex-1 w-full max-h-screen">
        {/* simple bar provides scrolling bars on rescale */}
        <Simplebar autoHide={false} className="max-h-[calc(100vh-10rem)]">
          <div ref={ref}>
            <PdfDocument
              currentPage={currentPage}
              url={url}
              scale={scale}
              rotation={rotation}
              width={width}
              setNumPages={setNumPages}
            />
          </div>
        </Simplebar>
      </div>
    </div>
  );
};
export default PdfRenderer;
