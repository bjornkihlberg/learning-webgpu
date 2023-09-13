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
