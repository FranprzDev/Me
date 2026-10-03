fn hash(p0: vec3f) -> f32 {
  var p = fract(p0 * 0.3183099 + vec3f(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

fn valueNoise(position: vec3f) -> f32 {
  let i = floor(position);
  var f = fract(position);
  f = f * f * (vec3f(3.0) - 2.0 * f);
  let x00 = mix(hash(i), hash(i + vec3f(1.0, 0.0, 0.0)), f.x);
  let x10 = mix(hash(i + vec3f(0.0, 1.0, 0.0)), hash(i + vec3f(1.0, 1.0, 0.0)), f.x);
  let x01 = mix(hash(i + vec3f(0.0, 0.0, 1.0)), hash(i + vec3f(1.0, 0.0, 1.0)), f.x);
  let x11 = mix(hash(i + vec3f(0.0, 1.0, 1.0)), hash(i + vec3f(1.0, 1.0, 1.0)), f.x);
  return mix(mix(x00, x10, f.y), mix(x01, x11, f.y), f.z);
}

fn fbm(position: vec3f, octaves: f32) -> f32 {
  var p = position;
  var value = 0.0;
  var amplitude = 0.5;
  for (var i = 0; i < 5; i++) {
    if (f32(i) >= octaves) { break; }
    value += amplitude * valueNoise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

export fn nebulaColor(position: vec3f, time: f32, scroll: f32, intensity: f32, octaves: f32) -> vec3f {
  let direction = normalize(position);
  var q = direction * 3.2;
  q.y += scroll * 1.4;
  q += vec3f(time * 0.008, time * 0.005, 0.0);
  let n = fbm(q, octaves);
  let n2 = fbm(q * 2.1 + vec3f(4.7), octaves);
  let clouds = smoothstep(0.42, 0.85, n * 0.72 + n2 * 0.38);
  let deep = vec3f(0.02, 0.03, 0.09);
  let blue = vec3f(0.10, 0.20, 0.62);
  let violet = vec3f(0.24, 0.16, 0.55);
  let gold = vec3f(0.91, 0.76, 0.44);
  var color = mix(deep, blue, smoothstep(0.15, 0.7, n));
  color = mix(color, violet, clouds * 0.75);
  color += gold * pow(clouds, 6.0) * 0.22;
  return color * intensity;
}

export fn atmosphereColor(normal: vec3f, viewDirection: vec3f, colorA: vec3f, colorB: vec3f) -> vec3f {
  let rim = pow(1.0 - abs(dot(normalize(normal), normalize(viewDirection))), 2.4);
  return mix(colorA, colorB, rim);
}

export fn atmosphereOpacity(normal: vec3f, viewDirection: vec3f, opacity: f32) -> f32 {
  let rim = pow(1.0 - abs(dot(normalize(normal), normalize(viewDirection))), 2.4);
  return rim * 0.85 * opacity;
}
