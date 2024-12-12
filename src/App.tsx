'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function Page() {
  const el = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let requestId: number;

    async function main() {
      if (!el.current) {
        return;
      }
      el.current.innerHTML = '';
      // canvas
      const canvas = el.current;

      /**
       * Base
       */
      // Debug
      // const gui = new GUI()

      // Scene
      const scene = new THREE.Scene()

      /**
       * Test cube
       */
      // const cube = new THREE.Mesh(
      //     new THREE.BoxGeometry(1, 1, 1),
      //     new THREE.MeshBasicMaterial()
      // )
      // scene.add(cube)

      /**
       * Sizes
       */
      const sizes = {
          width: window.innerWidth,
          height: window.innerHeight
      }

      window.addEventListener('resize', () =>
      {
          // Update sizes
          sizes.width = window.innerWidth
          sizes.height = window.innerHeight

          // Update camera
          camera.aspect = sizes.width / sizes.height
          camera.updateProjectionMatrix()

          // Update renderer
          renderer.setSize(sizes.width, sizes.height)
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      })

      /**
       * Camera
       */
      // Base camera
      const camera = new THREE.PerspectiveCamera(70, sizes.width / sizes.height, 0.1, 100)
      camera.position.set(4, 7, 4);  // 카메라를 위로 이동 (Y축 방향)
      scene.add(camera)

      // Controls
      const controls = new OrbitControls(camera, canvas)
      controls.enableDamping = true

      /**
       * Renderer
       */
      const renderer = new THREE.WebGLRenderer({
          canvas: canvas
      })
      renderer.setSize(sizes.width, sizes.height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      /**
       * Galaxy
       */
      const parameters = {
        count: 200000,
        size: 0.02,
        radius: 3,
        branches: 4,
        randomness: 0.3,
        randomnessPower: 0,
        insideColor: '#ff6030',
        outsideColor: '#1b3984',
        rotationSpeed: 4, // 회전 속도 추가
      }

      let geometry: THREE.BufferGeometry | null = null
      let material: THREE.PointsMaterial | null = null
      let points: THREE.Points | null = null
      const colors = new Float32Array(parameters.count * 3)

      /**
       * Objects
       */
      // 구체의 지오메트리 생성
      const sphereGeometry = new THREE.SphereGeometry(0.9, 64, 64);
      // 하늘색과 하얀색 정의
      const skyBlue = new THREE.Color('#87CEEB'); // 하늘색
      const white = new THREE.Color('#FFFFFF');   // 하얀색
      // 버텍스 색상 배열 생성
      const sphereColors = new Float32Array(sphereGeometry.attributes.position.count * 3);
      for (let i = 0; i < sphereColors.length; i += 3) {
        // 0에서 1 사이의 랜덤 값 생성
        const t = Math.random();

        // 하늘색과 하얀색 사이에서 랜덤 보간
        const color = skyBlue.clone().lerp(white, t);
        sphereColors[i] = color.r;     // R 값
        sphereColors[i + 1] = color.g; // G 값
        sphereColors[i + 2] = color.b; // B 값
      }

      // 색상 속성으로 추가
      sphereGeometry.setAttribute('color', new THREE.BufferAttribute(sphereColors, 3));

      const sphere = new THREE.Mesh(
        sphereGeometry,
        new THREE.MeshBasicMaterial({ vertexColors: true, })
      )
      scene.add(sphere)

      /**
       * Fog
       */
      const fogGroup = new THREE.Group();
      // 안개를 위한 원형 지오메트리 생성
      const fogGeometry = new THREE.CircleGeometry(parameters.radius + 0.1, 64); // 반지름과 세그먼트 수

      // 안개 재질 생성
      const fogMaterial = new THREE.MeshBasicMaterial({
        color: '#FFFFFF',
        transparent: true,     // 투명도 활성화
        opacity: 0.5,          // 투명도 설정
        side: THREE.DoubleSide // 양면 렌더링
      });

      for (let i = 0; i < 1; i++) {
        const fogMesh = new THREE.Mesh(fogGeometry, fogMaterial);
        fogMesh.position.set(
          0,
          0,
          0
        );
        fogMesh.rotation.x = -Math.PI / 2
        fogMesh.scale.setScalar(1 + Math.random() * 0.1); // 크기 랜덤화
        fogGroup.add(fogMesh);
      }
      scene.add(fogGroup);

      /**
       * Objects - winds
       */
      const windGroup = new THREE.Group();
      const numPoints = 500; // 점의 개수
      const radius = parameters.radius + 0.1; // 점들이 퍼질 반경

      // 점 지오메트리 생성
      const pointsGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(numPoints * 3);

      for (let i = 0; i < numPoints; i++) {
        const angle = Math.random() * Math.PI * 2; // 랜덤한 각도
        const distance = Math.random() * radius;   // 중심에서 퍼질 거리

        positions[i * 3] = Math.cos(angle) * distance; // x 좌표
        positions[i * 3 + 1] = 0;                      // y 좌표를 0으로 고정
        positions[i * 3 + 2] = Math.sin(angle) * distance; // z 좌표
      }

      pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // 점 재질 생성
      const pointsMaterial = new THREE.PointsMaterial({
        color: '#c1dde9',
        size: 0.05,          // 점의 크기
        transparent: true,
        opacity: 0.7,
        depthWrite: false    // 겹침 방지
      });

      // 점 메쉬 생성
      const windPoints = new THREE.Points(pointsGeometry, pointsMaterial);
      windGroup.add(windPoints);
      windGroup.position.set(0, 0, 0); // 위치 설정

      // 씬에 추가
      scene.add(windGroup);



      const generateGalaxy = () => {
        // Destroy old galaxy
        if (points !== null) {
          geometry?.dispose()
          material?.dispose()
          scene.remove(points)
        }

        /**
         * Geometry
         */
        geometry = new THREE.BufferGeometry()

        const positions = new Float32Array(parameters.count * 3)

        for (let i = 0; i < parameters.count; i++) {
          const i3 = i * 3
          const radius = Math.random() * parameters.radius
          const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2

          // 반지름이 작을수록 offset이 커지도록 설정
          const K = 15;
          const offsetMultiplier = K / Math.pow(radius, 2);
          const offsetX = Math.pow(Math.random(), parameters.randomnessPower) * Math.random() * parameters.randomness * offsetMultiplier
          const offsetY = Math.pow(Math.random(), parameters.randomnessPower) * Math.random() * parameters.randomness * (2 - radius)
          const offsetZ = Math.pow(Math.random(), parameters.randomnessPower) * Math.random() * parameters.randomness * offsetMultiplier

          positions[i3    ] = Math.cos((branchAngle + radius) + offsetX) * radius
          positions[i3 + 1] = offsetY
          positions[i3 + 2] = Math.sin((branchAngle + radius) + offsetZ) * radius

          const colorInside = new THREE.Color(parameters.insideColor);
          const colorOutside = new THREE.Color(parameters.outsideColor);
          const mixedColor = colorInside.clone();
          mixedColor.lerp(colorOutside, radius / parameters.radius);

          colors[i3    ] = new THREE.Color('#87CEEB').r
          colors[i3 + 1] = new THREE.Color('#87CEEB').g
          colors[i3 + 2] = new THREE.Color('#87CEEB').b
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

        /**
         * Material
         */
        material = new THREE.PointsMaterial({
          size: parameters.size,
          sizeAttenuation: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          vertexColors: true,
        })

        /**
         * Points
         */
        points = new THREE.Points(geometry, material)
        const galaxy = new THREE.Group()
        galaxy.add(points)
        scene.add(galaxy)
        return galaxy;
      }
      const galaxy = generateGalaxy()

      /**
       * Animate
       */
      const clock = new THREE.Clock()

      const tick = () => {
        const elapsedTime = clock.getElapsedTime()

        // Sphere를 회전
        sphere.rotation.y += parameters.rotationSpeed;
        galaxy.rotation.y = elapsedTime * 50;

        // 안개 회전 애니메이션
        fogGroup.rotation.y = elapsedTime;   // 원형 메쉬를 천천히 회전

        // 빠르게 회전하는 애니메이션
        windGroup.rotation.y = elapsedTime * 60; // 빠른 속도로 회전

        // Update controls
        controls.update()

        // Render
        renderer.render(scene, camera)

        // Call tick again on the next frame
        window.requestAnimationFrame(tick)
      }

      tick()
    }
    main();

    return () => {
      cancelAnimationFrame(requestId);
    };
  });

  return <canvas style={{ display: 'block' }} ref={el}></canvas>;
}

export default Page;
