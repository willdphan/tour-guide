import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const testimonials = [
  {
    quote: "Had no idea what would happen, hopped on and knew the next steps.",
    name: "Desperate Dave"
  },
  {
    quote: "This app is a game-changer for decision-making!",
    name: "Analytical Anna"
  },
  {
    quote: "I've never felt more confident about my choices.",
    name: "Confident Carl"
  }
];

export function Hero() {
  const [percentage, setPercentage] = useState(70);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    // Percentage animation logic (unchanged)
    const percentageInterval = setInterval(() => {
      setPercentage(prev => {
        const change = Math.floor(Math.random() * 11) - 5;
        return Math.min(Math.max(prev + change, 0), 100);
      });
    }, 50);

    // Testimonial rotation logic
    const testimonialInterval = setInterval(() => {
      setIsBlurred(true);
      setTimeout(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        setIsBlurred(false);
      }, 500); // Half of the transition duration
    }, 5000); // Change testimonial every 5 seconds

    return () => {
      clearInterval(percentageInterval);
      clearInterval(testimonialInterval);
    };
  }, []);

  return (
    <div className='w-fit items-center gap-2 min-w-screen flex flex-col mt-[30px] z-[99] '>
      <h1 className='font-man text-6xl text-black ml-10 leading-tight tracking-normal'>
        There's a <span className="text-[#A4BCDB]">{percentage}%</span> Chance <br/>It'll Play Out, <Link href="/flowchart" className="text-[#A4BCDB] underline decoration-4  underline-offset-8">Prolly</Link>.
        <br />
        <div className='flex flex-col gap-1'>
          <span className={`mt-8 text-sm font-mono uppercase w-[25em] inline-block break-words whitespace-normal overflow-wrap-normal italic transition-all duration-1000 ${isBlurred ? 'blur-sm' : 'blur-none'}`}>
            "{testimonials[currentTestimonial].quote}"
          </span>
          <span className={`mt-1 text-sm font-mono uppercase w-[25em] inline-block break-words whitespace-normal overflow-wrap-normal transition-all duration-1000 ${isBlurred ? 'blur-sm' : 'blur-none'}`}>
            - {testimonials[currentTestimonial].name}
          </span>
        </div>
      </h1>
    </div>
  );
}