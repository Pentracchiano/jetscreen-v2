"use client";
import React from "react";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import { classNames } from "../lib/classNames";

type ItemProps = {
  title?: string;
  stat: React.ReactNode | string;
  width?: string;
  textSize?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl"; // Extended options
};

type RowProps = ItemProps[];

type SlideContentProps = {
  rows: RowProps[];
};

type Props = {
  slides: SlideContentProps[]; // Updated: Array of slide content objects
  splideRef: any;
};

const options = {
  type: "loop",
  arrows: false,
  direction: "ttb",
  height: "100vh",
  autoplay: true,
  interval: 10000,
  speed: 1000,
  pagination: false,
};

const SlideHolder = ({ slides, splideRef }: Props) => {
  return (
    <>
      {/* @ts-expect-error Server Component */}
      <Splide options={options} ref={splideRef}>
        {slides.map((slideContent: SlideContentProps, slideIndex: number) => {
          return (
            <SplideSlide key={slideIndex}>
              <div className="h-full flex flex-col w-full text-white justify-center items-center p-4">
                {slideContent.rows.map((row: RowProps, rowIndex: number) => (
                  <div key={rowIndex} className="flex w-full justify-center">
                    {row.map((item: ItemProps, itemIndex: number) => (
                      <div
                        key={itemIndex}
                        className={classNames(
                          item.width ? item.width : "w-full",
                          "text-white items-center justify-center flex flex-col p-2 text-center" // Added text-center
                        )}
                      >
                        <span
                          className={classNames(
                            "font-semibold",
                            item.textSize === "5xl" ? "text-5xl" :
                            item.textSize === "4xl" ? "text-4xl" :
                            item.textSize === "3xl" ? "text-3xl" :
                            item.textSize === "xl" ? "text-2xl" : // Adjusted mapping
                            item.textSize === "lg" ? "text-xl" :
                            item.textSize === "md" ? "text-lg" :
                            "text-base" // Default stat size
                          )}
                        >
                          {item.stat}
                        </span>
                        {item.title && (
                           <div
                             className={classNames(
                               "mt-1", // Common margin
                               item.textSize === "5xl" ? "text-xl" :
                               item.textSize === "4xl" ? "text-lg" :
                               item.textSize === "3xl" ? "text-base" :
                               item.textSize === "xl" ? "text-sm" : // Adjusted mapping
                               item.textSize === "lg" ? "text-xs" :
                               item.textSize === "md" ? "text-xs" :
                               "text-xs" // Default title size
                             )}
                           >
                             {item.title}
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </SplideSlide>
          );
        })}
      </Splide>
    </>
  );
};

export default SlideHolder;
