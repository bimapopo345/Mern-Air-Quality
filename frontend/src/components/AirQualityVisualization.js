import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Text, Box } from '@react-three/drei';
import { Color } from 'three';

const AirQualityVisualization = ({ data }) => {
  const groupRef = useRef();
  const particlesRef = useRef();

  // Generate particle system based on air quality data
  const particles = useMemo(() => {
    if (!data) return null;

    const particleCount = Math.floor(data.aqi * 2); // More particles for worse air quality
    const positions = [];
    const colors = [];
    const sizes = [];

    for (let i = 0; i < particleCount; i++) {
      // Random position in a sphere
      const radius = Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );

      // Color based on AQI
      const color = new Color();
      if (data.aqi <= 50) {
        color.setHex(0x00e400); // Green
      } else if (data.aqi <= 100) {
        color.setHex(0xffff00); // Yellow
      } else if (data.aqi <= 150) {
        color.setHex(0xff7e00); // Orange
      } else if (data.aqi <= 200) {
        color.setHex(0xff0000); // Red
      } else if (data.aqi <= 300) {
        color.setHex(0x8f3f97); // Purple
      } else {
        color.setHex(0x7e0023); // Maroon
      }

      colors.push(color.r, color.g, color.b);
      sizes.push(Math.random() * 0.05 + 0.02);
    }

    return { positions, colors, sizes, count: particleCount };
  }, [data]);

  // Get sphere color based on AQI
  const getSphereColor = (aqi) => {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#ff0000';
    if (aqi <= 300) return '#8f3f97';
    return '#7e0023';
  };

  // Animate the visualization
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }

    if (particlesRef.current && particles) {
      // Animate particles floating
      const positions = particlesRef.current.geometry.attributes.position;
      for (let i = 0; i < particles.count; i++) {
        positions.array[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.001;
      }
      positions.needsUpdate = true;
    }
  });

  if (!data) {
    return (
      <group>
        <Text
          position={[0, 0, 0]}
          fontSize={0.5}
          color="#64ffda"
          anchorX="center"
          anchorY="middle"
        >
          No Data Available
        </Text>
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      {/* Central sphere representing overall air quality */}
      <Sphere args={[0.8, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color={getSphereColor(data.aqi)}
          transparent
          opacity={0.6}
          emissive={getSphereColor(data.aqi)}
          emissiveIntensity={0.2}
        />
      </Sphere>

      {/* Particle system representing pollutants */}
      {particles && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particles.count}
              array={new Float32Array(particles.positions)}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={particles.count}
              array={new Float32Array(particles.colors)}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              count={particles.count}
              array={new Float32Array(particles.sizes)}
              itemSize={1}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.05}
            transparent
            opacity={0.8}
            vertexColors
            sizeAttenuation
          />
        </points>
      )}

      {/* Data visualization rings */}
      <group position={[0, 0, 0]}>
        {/* PM2.5 Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.2, 0.02, 8, 32]} />
          <meshStandardMaterial
            color="#ff6b6b"
            transparent
            opacity={0.6}
            emissive="#ff6b6b"
            emissiveIntensity={data.pm25 / 100}
          />
        </mesh>

        {/* PM10 Ring */}
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]}>
          <torusGeometry args={[1.4, 0.02, 8, 32]} />
          <meshStandardMaterial
            color="#4dabf7"
            transparent
            opacity={0.6}
            emissive="#4dabf7"
            emissiveIntensity={data.pm10 / 100}
          />
        </mesh>

        {/* CO2 Ring */}
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]}>
          <torusGeometry args={[1.6, 0.02, 8, 32]} />
          <meshStandardMaterial
            color="#69db7c"
            transparent
            opacity={0.6}
            emissive="#69db7c"
            emissiveIntensity={data.co2 / 1000}
          />
        </mesh>
      </group>

      {/* Floating data labels */}
      <Text
        position={[2, 1.5, 0]}
        fontSize={0.2}
        color="#64ffda"
        anchorX="center"
        anchorY="middle"
      >
        AQI: {data.aqi}
      </Text>

      <Text
        position={[2, 1, 0]}
        fontSize={0.15}
        color="#ff6b6b"
        anchorX="center"
        anchorY="middle"
      >
        PM2.5: {data.pm25} μg/m³
      </Text>

      <Text
        position={[2, 0.5, 0]}
        fontSize={0.15}
        color="#4dabf7"
        anchorX="center"
        anchorY="middle"
      >
        PM10: {data.pm10} μg/m³
      </Text>

      <Text
        position={[2, 0, 0]}
        fontSize={0.15}
        color="#69db7c"
        anchorX="center"
        anchorY="middle"
      >
        CO2: {data.co2} ppm
      </Text>

      <Text
        position={[2, -0.5, 0]}
        fontSize={0.15}
        color="#ffd43b"
        anchorX="center"
        anchorY="middle"
      >
        Temp: {data.temperature}°C
      </Text>

      <Text
        position={[2, -1, 0]}
        fontSize={0.15}
        color="#74c0fc"
        anchorX="center"
        anchorY="middle"
      >
        Humidity: {data.humidity}%
      </Text>

      {/* Environmental indicators */}
      {data.temperature > 30 && (
        <Box args={[0.1, 0.1, 0.1]} position={[-2, 1, 0]}>
          <meshStandardMaterial color="#ff4757" emissive="#ff4757" emissiveIntensity={0.5} />
        </Box>
      )}

      {data.humidity > 70 && (
        <Sphere args={[0.05]} position={[-2, 0.5, 0]}>
          <meshStandardMaterial color="#3742fa" emissive="#3742fa" emissiveIntensity={0.5} />
        </Sphere>
      )}

      {data.aqi > 100 && (
        <mesh position={[-2, 0, 0]}>
          <octahedronGeometry args={[0.08]} />
          <meshStandardMaterial color="#ff3838" emissive="#ff3838" emissiveIntensity={0.8} />
        </mesh>
      )}
    </group>
  );
};

export default AirQualityVisualization;