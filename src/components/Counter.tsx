import React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const Counter = ({ value }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, latest => Math.round(latest));

  React.useEffect(() => {
    const animation = animate(count, value, { duration: 1 });

    return animation.stop;
  }, [value]);

  return (
    <div className="mb-4">
      <motion.span className="text-6xl font-bold font-ibm text-[#3C3C3C]">
        {rounded}
      </motion.span>
    </div>
  );
};

export default function AnimatedOutcomeCounter({ numberOfOutcomes }) {
  return (
    <Counter value={numberOfOutcomes} />
  );
}