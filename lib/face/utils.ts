import * as faceapi from 'face-api.js'
import '@tensorflow/tfjs-backend-wasm'
// ─── Constants ───────────────────────────────────────────────────────────────
export const MODEL_URL = '/models'

// ─── State Models Loaded ─────────────────────────────────────────────────────
let modelsLoaded = false
let loadingPromise: Promise<boolean> | null = null

export async function ensureModelsLoaded(): Promise<boolean> {
  if (modelsLoaded) return true

  // Mutex pattern: jika sedang diload oleh komponen lain, tunggu promise tersebut
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    try {
      // Pastikan backend GPU (WebGL) dipaksa nyala terlebih dahulu
      try {
        await faceapi.tf.setBackend('webgl')
      } catch {
        try {
          await faceapi.tf.setBackend('wasm')
        } catch (err) {
          console.warn('WebGL & WASM tidak didukung, pakai CPU (lambat)', err)
        }
      }
      await faceapi.tf.ready()

      console.log('TF Backend aktif:', faceapi.tf.getBackend())

      // Menggunakan Promise.race untuk menerapkan timeout 15 detik
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout loading models')), 15000)
      })

      await Promise.race([
        Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]),
        timeoutPromise
      ])
      
      modelsLoaded = true
      return true
    } catch (error) {
      console.error('Gagal memuat model face-api:', error)
      return false
    } finally {
      // Bersihkan promise agar bisa dicoba lagi jika gagal
      loadingPromise = null
    }
  })()

  return loadingPromise
}

// ─── Helpers untuk Liveness & Pencahayaan ────────────────────────────────────

export function getEuclideanDistance(pt1: { x: number, y: number }, pt2: { x: number, y: number }) {
  return Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2))
}

export function calculateEAR(eyePoints: { x: number, y: number }[]) {
  const v1 = getEuclideanDistance(eyePoints[1], eyePoints[5])
  const v2 = getEuclideanDistance(eyePoints[2], eyePoints[4])
  const h = getEuclideanDistance(eyePoints[0], eyePoints[3])
  return (v1 + v2) / (2.0 * h)
}

export function checkBrightness(video: HTMLVideoElement, canvas: HTMLCanvasElement): 'normal' | 'dark' | 'bright' {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return 'normal'
  canvas.width = 64
  canvas.height = 48
  if (canvas.width === 0 || canvas.height === 0) return 'normal'
  
  ctx.drawImage(video, 0, 0, 64, 48)
  const imageData = ctx.getImageData(0, 0, 64, 48)
  const data = imageData.data
  let avg = 0
  let count = 0
  for (let i = 0; i < data.length; i += 16) {
    avg += (data[i] + data[i+1] + data[i+2]) / 3
    count++
  }
  avg = Math.floor(avg / count)
  
  if (avg < 40) return 'dark'
  if (avg > 220) return 'bright'
  return 'normal'
}

export function getHeadTurnDirection(landmarks: { x: number, y: number }[]): 'left' | 'right' | 'center' {
  if (!landmarks || landmarks.length < 68) return 'center'
  
  // Ambil titik contour wajah (kiri dan kanan) serta ujung hidung
  const leftContour = landmarks[1]
  const rightContour = landmarks[15]
  const nose = landmarks[30]
  
  const leftDist = nose.x - leftContour.x
  const rightDist = rightContour.x - nose.x
  
  // Karena face-api membaca raw video (tanpa CSS mirror), maka jika hidung
  // lebih dekat ke kiri gambar, berarti pengguna menoleh ke KANAN mereka secara fisik.
  if (leftDist < rightDist * 0.6) return 'right'
  if (rightDist < leftDist * 0.6) return 'left'
  
  return 'center'
}

export function getYawRatio(landmarks: { x: number, y: number }[]): number {
  if (!landmarks || landmarks.length < 68) return 1
  const leftContour = landmarks[1]
  const rightContour = landmarks[15]
  const nose = landmarks[30]
  const leftDist = nose.x - leftContour.x
  const rightDist = rightContour.x - nose.x
  return leftDist / (rightDist || 1)
}

export function getEyeWidthRatio(landmarks: { x: number, y: number }[]): number {
  if (!landmarks || landmarks.length < 68) return 1
  // left eye (indices 36-41), width from 36 to 39
  // right eye (indices 42-47), width from 42 to 45
  const leftEyeWidth = getEuclideanDistance(landmarks[36], landmarks[39])
  const rightEyeWidth = getEuclideanDistance(landmarks[42], landmarks[45])
  return leftEyeWidth / (rightEyeWidth || 1)
}

