export const sizeOfFloat32 = 4

/** Initialize WebGPU
@param {HTMLCanvasElement} canvas
@returns {Promise<[GPUDevice, GPUCanvasContext, GPUTextureFormat]>}
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
  return [device, context, format]
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

/**
@param {GPUDevice} device
@param {GPUTextureFormat} format
@returns {GPURenderPipeline}
*/
export function createMainPipeline(device, format) {
  const mainShaderCode = `
    @group(0)
    @binding(0)
    var<uniform> camera: mat4x4f;

    struct VsInput {
      @location(0) position: vec3f,
      @location(1) normal:   vec3f,
      @location(2) texcoord: vec2f,
    };

    struct VsOutput {
      @builtin(position) position: vec4f,
      @location(0) normal:   vec3f,
      @location(1) texcoord: vec2f,
    };

    @vertex
    fn vertexShader(vsIn: VsInput) -> VsOutput {
      var vsOut: VsOutput;
      vsOut.position = camera * vec4f(vsIn.position, 1);
      vsOut.normal = vsIn.normal;
      vsOut.texcoord = vsIn.texcoord;
      return vsOut;
    }

    @fragment
    fn fragmentShader(vsOut: VsOutput) -> @location(0) vec4f {
      return vec4f(normalize(vsOut.normal), 1);
    }`

  const mainShaderModule = device.createShaderModule({
    label: "main-shader",
    code: mainShaderCode,
  })

  /** @type {GPUBindGroupLayoutEntry} */
  const cameraUniformBindGroupLayout = {
    binding: 0,
    visibility: GPUShaderStage.VERTEX,
    buffer: {
      type: "uniform",
      minBindingSize: sizeOfFloat32 * 4 * 4
    }
  }

  /** @type {GPUVertexAttribute} */
  const positionAttribute = {
    format: "float32x3",
    offset: 0,
    shaderLocation: 0,
  }
  const positionAttributeSize = 3 * sizeOfFloat32

  /** @type {GPUVertexAttribute} */
  const normalAttribute = {
    format: "float32x3",
    offset: positionAttributeSize,
    shaderLocation: 1,
  }
  const normalAttributeSize = 3 * sizeOfFloat32

  /** @type {GPUVertexAttribute} */
  const texcoordAttribute = {
    format: "float32x2",
    offset: positionAttributeSize + normalAttributeSize,
    shaderLocation: 2,
  }
  const texcoordAttributeSize = 2 * sizeOfFloat32

  /** @type {GPUVertexBufferLayout} */
  const vertexLayout = {
    arrayStride: positionAttributeSize + normalAttributeSize + texcoordAttributeSize,
    attributes: [positionAttribute, normalAttribute, texcoordAttribute],
  }

  return device.createRenderPipeline({
    label: "main-pipeline",
    layout: device.createPipelineLayout({
      label: "main-pipeline-layout",
      bindGroupLayouts: [device.createBindGroupLayout({
        label: "main-bind-group-layout",
        entries: [cameraUniformBindGroupLayout]
      })]
    }),
    vertex: {
      module: mainShaderModule,
      entryPoint: "vertexShader",
      buffers: [vertexLayout],
    },
    fragment: {
      module: mainShaderModule,
      entryPoint: "fragmentShader",
      targets: [{ format }],
    },
    primitive: {
      cullMode: "back",
      frontFace: "ccw",
      topology: "triangle-list",
    },
  })
}
