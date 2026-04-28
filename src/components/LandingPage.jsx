import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Sphere, Float, Stars, MeshDistortMaterial, Environment } from '@react-three/drei';

function AnimatedShape() {
  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={1.5}>
      <Sphere args={[1, 64, 64]} scale={1.3}>
        <MeshDistortMaterial
          color="#8b5cf6"
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          emissive="#4c1d95"
          emissiveIntensity={0.6}
        />
      </Sphere>
    </Float>
  );
}

// Animated section wrapper
function AnimatedSection({ children, delay = 0 }) {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, threshold: 0.1 });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay } }
      }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage({ onGetStarted }) {
  const featuresRef = useRef(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 overflow-x-hidden relative">
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 3] }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />
          <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
          <AnimatedShape />
          <Environment preset="night" />
        </Canvas>
      </div>

      {/* Overlay Content */}
      <div className="relative z-10 pointer-events-auto">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
                BridgeMapper
                <span className="block text-3xl sm:text-4xl lg:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300 mt-2">
                  Turn scattered data into action
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-xl text-white/80 max-w-2xl mx-auto"
            >
              Collect paper surveys, voice notes, and field reports. Visualise urgent needs on a live heatmap and instantly match volunteers to the tasks that matter most.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-wrap justify-center gap-4"
            >
              <button
                onClick={onGetStarted}
                className="px-8 py-3 bg-white text-purple-900 font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Get Started
              </button>
              <button
                onClick={scrollToFeatures}
                className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full border border-white/30 hover:bg-white/20 transition-all duration-300"
              >
                Learn More
              </button>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section ref={featuresRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-black/30 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
                Everything you need for smart coordination
              </h2>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <AnimatedSection delay={0.1}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 cursor-pointer"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Multi‑format Ingestion</h3>
                  <p className="mt-2 text-white/70">Upload paper surveys (OCR), voice notes, text reports, or CSV files – all in one place.</p>
                </motion.div>
              </AnimatedSection>

              {/* Feature 2 */}
              <AnimatedSection delay={0.2}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 cursor-pointer"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Live Urgency Heatmap</h3>
                  <p className="mt-2 text-white/70">Red zones show critical needs. Density‑based heatmap updates in real time as tasks arrive.</p>
                </motion.div>
              </AnimatedSection>

              {/* Feature 3 */}
              <AnimatedSection delay={0.3}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 cursor-pointer"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Smart Volunteer Matching</h3>
                  <p className="mt-2 text-white/70">Volunteers select their skills; they only see tasks they can help with. Accept with one click.</p>
                </motion.div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <AnimatedSection delay={0.4}>
              <h2 className="text-3xl font-bold text-white mb-4">Ready to make an impact?</h2>
              <p className="text-white/80 mb-8">Join NGOs and volunteers already using BridgeMapper to coordinate relief faster.</p>
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-purple-900 font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Launch App
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </AnimatedSection>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 text-center text-white/50 text-sm border-t border-white/10">
          <p>© 2026 BridgeMapper – Smart Resource Allocation for Social Impact</p>
        </footer>

        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}