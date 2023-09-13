/** Initialize WebGPU
@param {HTMLCanvasElement} canvas
@returns {Promise<[GPUDevice, GPUCanvasContext]>}
*/
export async function initialization(canvas) {
  if (!navigator.gpu) throw new Error("WebGPU is not supported on your browser or device.")
  const adapter = await navigator.gpu.requestAdapter()
  if (adapter === null) throw new Error("No appropriate GPUAdapter found.");
  const context = canvas.getContext("webgpu");
  if (context === null) throw new Error("Could not get webgpu context from canvas.");
  const device = await adapter.requestDevice({ label: "main-device" })
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format });
  return [device, context]
}

/**
@param {GPUDevice} device
@param {number} vertexByteLength
@param {number} indexByteLength
@returns {{ vertexBuffer: GPUBuffer, indexBuffer: GPUBuffer }}
*/
export function createMeshBuffers(device, vertexByteLength, indexByteLength) {
  return {
    vertexBuffer: device.createBuffer({
      size: vertexByteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    }),
    indexBuffer: device.createBuffer({
      size: indexByteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    }),
  }
}
