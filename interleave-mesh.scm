#!chezscheme

#|
scheme --program ./interleave-mesh.scm ./square.bin ./docs/square 4 6
scheme --program ./interleave-mesh.scm ./sphere.bin ./docs/sphere 3840 3840
|#

(import (chezscheme))

(define-values (gltf-file mesh-file vertex-count index-count) (apply values (command-line-arguments)))

(set! vertex-count (string->number vertex-count))
(set! index-count (string->number index-count))

(assert (fixnum? vertex-count))
(assert (fxnonnegative? vertex-count))
(assert (fixnum? index-count))
(assert (fxnonnegative? index-count))

(define-ftype vecf3
  (struct [x float]
          [y float]
          [z float]))

(define-ftype vecf2
  (struct [x float]
          [y float]))

(define-values (positions normals texcoords indices)
  (call-with-port (open-file-input-port gltf-file) (lambda (bip)
    (let* ([positions (get-bytevector-n bip (* (ftype-sizeof vecf3) vertex-count))]
           [normals   (get-bytevector-n bip (* (ftype-sizeof vecf3) vertex-count))]
           [texcoords (get-bytevector-n bip (* (ftype-sizeof vecf2) vertex-count))]
           [indices   (get-bytevector-n bip (* (ftype-sizeof unsigned-16) index-count))])
      (values positions normals texcoords indices)))))

(assert (fx= (bytevector-length positions) (* (ftype-sizeof vecf3) vertex-count)))
(assert (fx= (bytevector-length normals)   (* (ftype-sizeof vecf3) vertex-count)))
(assert (fx= (bytevector-length texcoords) (* (ftype-sizeof vecf2) vertex-count)))
(assert (fx= (bytevector-length indices)   (* (ftype-sizeof unsigned-16) index-count)))

(call-with-port (open-file-output-port (format #f "~a.indices" mesh-file) (file-options no-fail)) (lambda (bop)
  (put-bytevector bop indices)))

(call-with-port (open-file-output-port (format #f "~a.vertices" mesh-file) (file-options no-fail)) (lambda (bop)
  (let ([positions-bip (open-bytevector-input-port positions)]
        [normals-bip   (open-bytevector-input-port normals)]
        [texcoords-bip (open-bytevector-input-port texcoords)])
    (do ([i 0 (1+ i)]) ((fx>= i vertex-count))
      (do ([i 0 (1+ i)]) ((fx>= i (ftype-sizeof vecf3))) (put-u8 bop (get-u8 positions-bip)))
      (do ([i 0 (1+ i)]) ((fx>= i (ftype-sizeof vecf3))) (put-u8 bop (get-u8 normals-bip)))
      (do ([i 0 (1+ i)]) ((fx>= i (ftype-sizeof vecf2))) (put-u8 bop (get-u8 texcoords-bip)))))))
