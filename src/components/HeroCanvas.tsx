"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";

function Mountain() {
  const meshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const animateRotation = () => {
      mesh.rotation.y += 0.001;
      mesh.rotation.x += 0.0005;
      requestAnimationFrame(animateRotation);
    };
    animateRotation();
  }, []);

  return (
    <group ref={meshRef}>
      {/* Mountain pyramid */}
      <mesh castShadow>
        <coneGeometry args={[2, 4, 4]} />
        <meshPhongMaterial
          color="#16a34a"
          emissive="#0d8a3a"
          shininess={60}
        />
      </mesh>

      {/* Snow peak */}
      <mesh position={[0, 2, 0]} castShadow>
        <coneGeometry args={[0.8, 1.2, 4]} />
        <meshPhongMaterial color="#ffffff" shininess={100} />
      </mesh>

      {/* Secondary mountain */}
      <mesh position={[3, -0.5, -2]} castShadow>
        <coneGeometry args={[1.5, 3, 4]} />
        <meshPhongMaterial color="#15803d" emissive={" #0d6a2f"} />
      </mesh>
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <pointLight position={[-10, 10, 5]} intensity={0.8} color="#16a34a" />
      <pointLight position={[10, -10, 5]} intensity={0.6} color="#fbbf24" />
    </>
  );
}

export default function HeroCanvas() {
  return (
    <Canvas
      shadows
      className="w-full h-full"
      style={{
        background:
          "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)",
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 2, 6]} />
      <Lights />
      <Mountain />
      <OrbitControls
        autoRotate
        autoRotateSpeed={2}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={(Math.PI * 2) / 3}
      />
    </Canvas>
  );
}
