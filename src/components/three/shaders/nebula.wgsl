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

/** Weight of a soft glow lobe centred on `axis` (directions on the sky sphere). */
fn lobe(direction: vec3f, axis: vec3f, power: f32) -> f32 {
  return pow(max(dot(direction, normalize(axis)), 0.0), power);
}

/*
 * Deep night sky: a near-black navy base with layered glow lobes (blue upper
 * right, violet lower left, a warm gold haze low), wispy clouds and fine
 * filaments. The view centre (the camera looks down -z, where the page text
 * sits) is kept darker so copy stays readable. Output is linear and goes
 * through tone mapping, so the base values are intentionally tiny.
 */
export fn nebulaColor(position: vec3f, time: f32, scroll: f32, intensity: f32, octaves: f32) -> vec3f {
  let direction = normalize(position);
  var q = direction * 3.2;
  q.y += scroll * 1.4;
  q += vec3f(time * 0.008, time * 0.005, 0.0);
  let n = fbm(q, octaves);
  let n2 = fbm(q * 2.1 + vec3f(4.7), octaves);
  let region = smoothstep(0.3, 0.75, fbm(direction * 1.3 + vec3f(1.7 + time * 0.004, 0.3, 2.9), min(octaves, 3.0)));
  let wisps = smoothstep(0.44, 0.84, n * 0.7 + n2 * 0.42);
  let filaments = smoothstep(0.58, 0.95, n2) * wisps;
  let blueLobe = lobe(direction, vec3f(0.55, 0.45, -0.7), 6.0);
  let violetLobe = lobe(direction, vec3f(-0.6, -0.4, -0.7), 6.0);
  let goldLobe = lobe(direction, vec3f(0.1, -0.6, -0.8), 5.0);
  let centre = smoothstep(0.82, 0.99, -direction.z);
  let cloud = (0.2 + 0.8 * wisps) * (0.45 + 0.55 * region);
  var color = vec3f(0.002, 0.004, 0.016);
  color += vec3f(0.05, 0.13, 0.55) * blueLobe * cloud * 0.7;
  color += vec3f(0.22, 0.09, 0.48) * violetLobe * cloud * 0.7;
  color += vec3f(0.06, 0.06, 0.2) * region * wisps * 0.5;
  color += vec3f(0.95, 0.68, 0.34) * goldLobe * smoothstep(0.4, 0.85, n) * 0.2;
  color += vec3f(0.6, 0.7, 1.0) * filaments * (blueLobe + violetLobe + 0.25 * region) * 0.1;
  color *= 1.0 - 0.5 * centre;
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
