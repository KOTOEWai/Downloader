
import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center p-10 space-y-6">
      <div className="relative w-20 h-20">
        <motion.div
          animate={{
            rotate: 360,
            borderRadius: ["25%", "50%", "25%"]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-full h-full border-4 border-primary/30 border-t-primary shadow-[0_0_15px_rgba(0,229,255,0.3)]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 border-4 border-secondary/30 border-b-secondary rounded-full"
        />
      </div>
      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-primary font-bold tracking-widest uppercase text-xs"
      >
        Processing Request
      </motion.p>
    </div>
  );
}
