import { F as e, O as t, P as n, b as r, c as i, d as a, f as o, g as s, h as c, i as l, k as u, l as d, m as f, p, t as m, u as h, v as g, x as _, y as v } from "./animationPlaybackRuntime-Ccm10X-H.js";
import * as y from "three";
import { CompressedArrayTexture as b, CompressedCubeTexture as ee, CompressedTexture as te, Data3DTexture as ne, DataTexture as re, FileLoader as ie, FloatType as x, HalfFloatType as S, LinearFilter as ae, LinearMipmapLinearFilter as oe, LinearSRGBColorSpace as se, Loader as ce, NoColorSpace as le, RGBAFormat as C, RGBA_ASTC_4x4_Format as ue, RGBA_ASTC_6x6_Format as de, RGBA_BPTC_Format as fe, RGBA_ETC2_EAC_Format as pe, RGBA_PVRTC_4BPPV1_Format as me, RGBA_S3TC_DXT1_Format as he, RGBA_S3TC_DXT3_Format as ge, RGBA_S3TC_DXT5_Format as _e, RGB_BPTC_UNSIGNED_Format as ve, RGB_ETC1_Format as ye, RGB_ETC2_Format as be, RGB_PVRTC_4BPPV1_Format as xe, RGB_S3TC_DXT1_Format as Se, RGFormat as Ce, RedFormat as we, SRGBColorSpace as Te, UnsignedByteType as w } from "three";
//#region src/data/sampleScene.ts
var Ee = {
	x: -15,
	y: 50,
	z: 0
}, De = {
	x: -.7127446532249451,
	y: .258819043636322,
	z: .6519262194633484
}, T = {
	x: .833125114440918,
	y: -.3420201539993286,
	z: .43465474247932434
}, E = {
	ambientColor: {
		r: .5,
		g: .5,
		b: .5
	},
	ambientIntensity: 1,
	specularColor: {
		r: 1,
		g: 1,
		b: 1
	},
	specularIntensity: 1,
	rimColor: {
		r: .5,
		g: .5,
		b: .5
	},
	rimColorAlpha: 1,
	rimRange: 7,
	rimEdgeSmoothness: .0010000000474974513,
	rimEmission: 0,
	rimLightInfluence: 1,
	shadowRimColor: {
		r: 0,
		g: 0,
		b: 0
	},
	rimShadowSharpness: .5
}, Oe = De, ke = {
	x: Oe.x,
	y: Oe.y,
	z: Oe.z,
	intensity: 1,
	ambient: 0,
	shadowThreshold: .40625,
	shadowWeight: 1,
	characterAmbient: E.ambientIntensity,
	rimColorAlpha: E.rimColorAlpha,
	rimRange: E.rimRange,
	rimEdgeSmoothness: E.rimEdgeSmoothness,
	rimEmission: E.rimEmission,
	rimLightInfluence: E.rimLightInfluence,
	rimShadowSharpness: E.rimShadowSharpness
};
E.ambientIntensity, E.rimColorAlpha, E.rimRange, E.rimEdgeSmoothness, E.rimEmission, E.rimLightInfluence, E.rimShadowSharpness;
//#endregion
//#region src/materials/sekaiCharacterLighting.ts
function D(e) {
	return Math.min(Math.max(e, 0), 1);
}
function Ae(e) {
	let t = D(e);
	return t * t * (3 - 2 * t);
}
function je(e) {
	let t = e.normalDotLight * .5 + .5, n = D((e.useLambert ? t : 1) + 2 * (e.useValueTex ? e.valueB : .5) - 1), r = D(e.threshold), i = D(e.width), a = e.fadeMode < .5 ? Math.max(r * i, 1e-5) : Math.max((1 - r) * i, 1e-5);
	return {
		rawLight: n,
		shadow: 1 - Ae(e.fadeMode < .5 ? D((n - r * (1 - i)) / a) : D((n - r) / a))
	};
}
function Me(e) {
	let t = e.headDotX <= 0 ? e.mirroredSdf : e.sdf, n = D(e.useLimiter ? Math.min(Math.max((1 - Math.abs(2 * e.headDotY - 1)) * .5, 0), e.rangeLimit) : e.headDotY), r = D(e.width), i = e.fadeMode < .5 ? D((n - t) / Math.max((1 - t) * r, 1e-5)) : D((t - n) / Math.max((1 - n) * r, 1e-5));
	return {
		sdf: t,
		threshold: n,
		shadow: e.fadeMode < .5 ? Ae(i) : 1 - Ae(i)
	};
}
function Ne(e) {
	let t = D(e.skinValue * 2), n = D(e.skinValue * 2 - 1);
	return e.defaultSkin.map((r, i) => {
		let a = e.shadow1Skin[i] * e.globalShadow[i], o = e.shadow2Skin[i] * e.globalShadow[i];
		return o + (a + (r - a) * n - o) * t;
	});
}
var Pe = "\nfloat sekaiSmooth01(float value) {\n  float x = clamp(value, 0.0, 1.0);\n  return x * x * (3.0 - 2.0 * x);\n}\n\nfloat sekaiBaseShadow(\n  float normalDotLight,\n  float valueB,\n  float useLambert,\n  float useValueTex,\n  float threshold,\n  float width,\n  float fadeMode\n) {\n  float halfLambert = normalDotLight * 0.5 + 0.5;\n  float baseLight = useLambert > 0.5 ? halfLambert : 1.0;\n  float selectedValueB = useValueTex > 0.5 ? valueB : 0.5;\n  float rawLight = clamp(baseLight + 2.0 * selectedValueB - 1.0, 0.0, 1.0);\n  float t = clamp(threshold, 0.0, 1.0);\n  float w = clamp(width, 0.0, 1.0);\n  float q = fadeMode < 0.5\n    ? clamp((rawLight - t * (1.0 - w)) / max(t * w, 0.00001), 0.0, 1.0)\n    : clamp((rawLight - t) / max((1.0 - t) * w, 0.00001), 0.0, 1.0);\n  return 1.0 - sekaiSmooth01(q);\n}\n\nfloat sekaiFaceShadow(\n  float sdf,\n  float threshold,\n  float width,\n  float fadeMode\n) {\n  float w = clamp(width, 0.0, 1.0);\n  float q = fadeMode < 0.5\n    ? clamp((threshold - sdf) / max((1.0 - sdf) * w, 0.00001), 0.0, 1.0)\n    : clamp((sdf - threshold) / max((1.0 - threshold) * w, 0.00001), 0.0, 1.0);\n  return fadeMode < 0.5 ? sekaiSmooth01(q) : 1.0 - sekaiSmooth01(q);\n}\n", Fe = "\nvec3 sekaiApplyHsvc(\n  vec3 color,\n  float hueSin,\n  float hueCos,\n  float saturation,\n  float value,\n  float contrast\n) {\n  vec3 axis = vec3(0.577350259);\n  vec3 rotated =\n    color * hueCos +\n    cross(axis, color) * hueSin +\n    axis * dot(axis, color) * (1.0 - hueCos);\n  rotated =\n    (rotated - vec3(0.5)) * (contrast * 2.0) +\n    vec3(value * 2.0 - 0.5);\n  float luma = dot(rotated, vec3(0.22, 0.707, 0.071));\n  return (rotated - vec3(luma)) * (saturation * 2.0) + vec3(luma);\n}\n\nvec3 sekaiSkinRamp(\n  float skinValue,\n  vec3 globalShadow,\n  vec3 defaultSkin,\n  vec3 shadow1Skin,\n  vec3 shadow2Skin\n) {\n  vec3 mid = globalShadow * shadow1Skin;\n  vec3 dark = globalShadow * shadow2Skin;\n  vec3 upperBand = mix(mid, defaultSkin, clamp(skinValue * 2.0 - 1.0, 0.0, 1.0));\n  return mix(dark, upperBand, clamp(skinValue * 2.0, 0.0, 1.0));\n}\n\nvec3 sekaiOverlay(vec3 base, vec3 blend) {\n  vec3 multiplyBranch = 2.0 * base * blend;\n  vec3 screenBranch = 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);\n  return mix(multiplyBranch, screenBranch, step(vec3(0.5), base));\n}\n\nvec3 sekaiApplyCharacterAmbient(\n  vec3 color,\n  vec3 ambientColor,\n  float ambientIntensity,\n  vec4 partsAmbientColor\n) {\n  vec3 overlaid = sekaiOverlay(color, ambientColor);\n  float intensity = ambientIntensity;\n  vec3 multiplied = overlaid * intensity * partsAmbientColor.rgb;\n  vec3 screened =\n    1.0 -\n    2.0 * (1.0 - overlaid * intensity) * (1.0 - partsAmbientColor.rgb);\n  return mix(screened, multiplied, clamp(partsAmbientColor.a, 0.0, 1.0));\n}\n\n";
//#endregion
//#region src/materials/sekaiCharacterShader.ts
function O(e, t) {
	return t instanceof y.Color ? e.copy(t) : typeof t == "number" ? e.setHex(t, y.LinearSRGBColorSpace) : e.setStyle(t, y.LinearSRGBColorSpace);
}
function k(e) {
	return O(new y.Color(), e);
}
function A(e, t) {
	return e === void 0 ? new y.Color().setRGB(t.r, t.g, t.b) : k(e);
}
function j(e) {
	return e ? (e.updateMatrix(), e.matrix.clone()) : new y.Matrix3();
}
var Ie = "\n  vec3 sekaiGammaTexture(vec3 linearColor) {\n    vec3 safeColor = max(linearColor, vec3(0.0));\n    vec3 low = safeColor * 12.92;\n    vec3 high = pow(safeColor, vec3(1.0 / 2.4)) * 1.055 - vec3(0.055);\n    return mix(low, high, step(vec3(0.0031308), safeColor));\n  }\n\n  vec4 sekaiGammaTexture(vec4 linearColor) {\n    return vec4(sekaiGammaTexture(linearColor.rgb), linearColor.a);\n  }\n";
function Le(e) {
	return new y.ShaderMaterial({
		transparent: !1,
		depthWrite: !0,
		side: y.FrontSide,
		vertexColors: !0,
		uniforms: {
			uBaseColor: { value: k(e.baseColor) },
			uShadowColor: { value: k(e.shadowColor) },
			uSkinColorDefault: { value: k(e.skinColorDefault ?? e.baseColor) },
			uSkinColor1: { value: k(e.skinColor1 ?? e.shadowColor) },
			uSkinColor2: { value: k(e.skinColor2 ?? e.skinColor1 ?? e.shadowColor) },
			uPartsAmbientColor: { value: k(e.partsAmbientColor ?? "#ffffff") },
			uPartsAmbientAlpha: { value: e.partsAmbientAlpha ?? 0 },
			uReflectionBlendColor: { value: k(e.reflectionBlendColor ?? "#ffffff") },
			uGlobalShadowColor: { value: k(e.globalShadowColor ?? "#ffffff") },
			uGlobalShadowAlpha: { value: e.globalShadowAlpha ?? 1 },
			uControllerAmbientColor: { value: A(e.controllerAmbientColor, E.ambientColor) },
			uControllerAmbientIntensity: { value: e.controllerAmbientIntensity ?? 1 },
			uControllerSpecularColor: { value: k(e.controllerSpecularColor ?? "#ffffff") },
			uControllerSpecularIntensity: { value: e.controllerSpecularIntensity ?? 1 },
			uControllerRimColor: { value: A(e.controllerRimColor, E.rimColor) },
			uControllerShadowRimColor: { value: A(e.controllerShadowRimColor, E.shadowRimColor) },
			uControllerRimColorWeight: { value: e.controllerRimColorWeight ?? 1 },
			uControllerShadowRimColorWeight: { value: e.controllerShadowRimColorWeight ?? 1 },
			uControllerRimRange: { value: e.controllerRimRange ?? E.rimRange },
			uControllerRimEdgeSmoothness: { value: e.controllerRimEdgeSmoothness ?? E.rimEdgeSmoothness },
			uControllerRimEmission: { value: e.controllerRimEmission ?? E.rimEmission },
			uControllerRimLightInfluence: { value: e.controllerRimLightInfluence ?? E.rimLightInfluence },
			uControllerRimShadowSharpness: { value: e.controllerRimShadowSharpness ?? E.rimShadowSharpness },
			uBodyDebugMode: { value: e.bodyDebugMode ?? 0 },
			uMainTex: { value: e.mainTex ?? null },
			uShadowTex: { value: e.shadowTex ?? null },
			uValueTex: { value: e.valueTex ?? null },
			uMainTexTransform: { value: j(e.mainTex) },
			uUseMainTex: { value: +!!e.mainTex },
			uUseShadowTex: { value: +!!e.shadowTex },
			uHasValueTex: { value: +!!e.valueTex },
			uUseValueTex: { value: e.useValueTex ?? !!e.valueTex ? 1 : 0 },
			uLightDirection: { value: e.lightDirection.clone().normalize() },
			uCameraPosition: { value: new y.Vector3() },
			uLightIntensity: { value: e.lightIntensity },
			uAmbientIntensity: { value: e.ambientIntensity },
			uShadowThreshold: { value: e.shadowThreshold },
			uShadowWeight: { value: e.shadowWeight },
			uShadowWidth: { value: e.shadowWidth ?? 0 },
			uShadowFade: { value: e.shadowFade ?? 0 },
			uShadowWidthOverride: { value: e.shadowWidthOverride ?? -1 },
			uValueShadowInfluence: { value: e.valueShadowInfluence ?? 0 },
			uCharacterAmbientIntensity: { value: e.characterAmbientIntensity ?? .3 },
			uRimColorAlpha: { value: e.rimColorAlpha ?? E.rimColorAlpha },
			uRimDirection: { value: (e.rimDirection ?? new y.Vector3(T.x, T.y, T.z)).clone().normalize() },
			uSpecularPower: { value: e.specularPower ?? 0 },
			uRimThreshold: { value: e.rimThreshold ?? .2 },
			uShadowTexWeight: { value: e.shadowTexWeight ?? 1 },
			uFadeMode: { value: e.fadeMode ?? 0 },
			uHueSinAngle: { value: e.hueSinAngle ?? 0 },
			uHueCosAngle: { value: e.hueCosAngle ?? 1 },
			uHairShadowEnabled: { value: +!!e.hairShadowEnabled },
			uUseLambert: { value: e.useLambert === !1 ? 0 : 1 },
			uHeadPosition: { value: (e.headPosition ?? new y.Vector3()).clone() },
			uHeadNormalBlend: { value: e.headNormalBlend ?? .7 },
			uSaturation: { value: e.saturation ?? .5 },
			uValue: { value: e.value ?? .5 },
			uContrast: { value: e.contrast ?? .5 },
			uAlphaCutoff: { value: e.alphaCutoff ?? 0 }
		},
		vertexShader: "\n      #include <common>\n      #include <uv_pars_vertex>\n      #include <color_pars_vertex>\n      #include <skinning_pars_vertex>\n\n      varying vec3 vWorldPosition;\n      varying vec3 vWorldNormal;\n      varying vec3 vViewPosition;\n      varying vec3 vModelPosition;\n      varying vec2 vUv;\n\n      uniform float uHairShadowEnabled;\n      uniform vec3 uHeadPosition;\n      uniform float uHeadNormalBlend;\n\n      void main() {\n        #include <uv_vertex>\n        #include <color_vertex>\n        #include <skinbase_vertex>\n        #include <beginnormal_vertex>\n        #include <skinnormal_vertex>\n        #include <defaultnormal_vertex>\n        #include <begin_vertex>\n        #include <skinning_vertex>\n\n        vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);\n        vec4 viewPosition = viewMatrix * worldPosition;\n        vWorldPosition = worldPosition.xyz;\n        vec3 worldNormal = inverseTransformDirection(\n          transformedNormal,\n          viewMatrix\n        );\n        vWorldNormal = worldNormal;\n        vViewPosition = viewPosition.xyz;\n        vModelPosition = transformed;\n        vUv = uv;\n        gl_Position = projectionMatrix * viewPosition;\n      }\n    ",
		fragmentShader: `
      #include <common>
      #include <color_pars_fragment>

      uniform vec3 uBaseColor;
      uniform vec3 uShadowColor;
      uniform vec3 uSkinColorDefault;
      uniform vec3 uSkinColor1;
      uniform vec3 uSkinColor2;
      uniform vec3 uPartsAmbientColor;
      uniform float uPartsAmbientAlpha;
      uniform vec3 uReflectionBlendColor;
      uniform vec3 uGlobalShadowColor;
      uniform float uGlobalShadowAlpha;
      uniform vec3 uControllerAmbientColor;
      uniform float uControllerAmbientIntensity;
      uniform vec3 uControllerSpecularColor;
      uniform float uControllerSpecularIntensity;
      uniform vec3 uControllerRimColor;
      uniform vec3 uControllerShadowRimColor;
      uniform float uControllerRimColorWeight;
      uniform float uControllerShadowRimColorWeight;
      uniform float uControllerRimRange;
      uniform float uControllerRimEdgeSmoothness;
      uniform float uControllerRimEmission;
      uniform float uControllerRimLightInfluence;
      uniform float uControllerRimShadowSharpness;
      uniform float uBodyDebugMode;
      uniform sampler2D uMainTex;
      uniform sampler2D uShadowTex;
      uniform sampler2D uValueTex;
      uniform mat3 uMainTexTransform;
      uniform float uUseMainTex;
      uniform float uUseShadowTex;
      uniform float uHasValueTex;
      uniform float uUseValueTex;
      uniform vec3 uLightDirection;
      uniform vec3 uCameraPosition;
      uniform float uLightIntensity;
      uniform float uAmbientIntensity;
      uniform float uShadowThreshold;
      uniform float uShadowWeight;
      uniform float uShadowWidth;
      uniform float uShadowFade;
      uniform float uShadowWidthOverride;
      uniform float uValueShadowInfluence;
      uniform float uCharacterAmbientIntensity;
      uniform float uRimColorAlpha;
      uniform vec3 uRimDirection;
      uniform float uSpecularPower;
      uniform float uRimThreshold;
      uniform float uShadowTexWeight;
      uniform float uFadeMode;
      uniform float uHueSinAngle;
      uniform float uHueCosAngle;
      uniform float uUseLambert;
      uniform float uSaturation;
      uniform float uValue;
      uniform float uContrast;
      uniform float uAlphaCutoff;

      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec3 vViewPosition;
      varying vec3 vModelPosition;
      varying vec2 vUv;

      ${Pe}
      ${Fe}
      ${Ie}

      vec3 outputColor(vec3 color) {
        return color;
      }

      vec3 applyMaterialHsvc(vec3 color) {
        return sekaiApplyHsvc(
          color,
          uHueSinAngle,
          uHueCosAngle,
          uSaturation,
          uValue,
          uContrast
        );
      }

      float toonBand(float value, float threshold, float width) {
        return width <= 0.0001
          ? step(threshold, value)
          : smoothstep(threshold - width, threshold + width, value);
      }

      void main() {
        vec3 normal = normalize(vWorldNormal);
        vec3 lightDir = normalize(uLightDirection);
        vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
        float ndl = dot(normal, lightDir);
        vec2 mainUv = (uMainTexTransform * vec3(vUv, 1.0)).xy;
        vec4 mainSample = vec4(1.0);
        vec3 mainColor = uBaseColor;
        if (uUseMainTex > 0.5) {
          mainSample = sekaiGammaTexture(texture2D(uMainTex, mainUv));
          if (uAlphaCutoff > 0.0 && mainSample.a < uAlphaCutoff) {
            discard;
          }
          mainColor = mainSample.rgb;
        }
        vec3 shadowValue = mainColor;
        if (uUseShadowTex > 0.5) {
          shadowValue = mix(
            shadowValue,
            sekaiGammaTexture(texture2D(uShadowTex, mainUv).rgb),
            clamp(uShadowTexWeight, 0.0, 1.0)
          );
        }
        vec4 valueSample = vec4(0.0, 0.0, 0.5, 0.0);
        if (uHasValueTex > 0.5) {
          valueSample = texture2D(uValueTex, mainUv);
        }
        float skinMask = uHasValueTex > 0.5
          ? step(0.5, valueSample.r)
          : 0.0;
        float hMask = valueSample.b;
        float hAlpha = valueSample.a;
        float vertexOutlineIntensity = 1.0;
        float vertexRimMask = 1.0;
        #ifdef USE_COLOR
        vertexOutlineIntensity = clamp(vColor.r, 0.0, 1.0);
        vertexRimMask = clamp(vColor.g, 0.0, 1.0);
        #endif

        float halfNdl = clamp(ndl * 0.5 + 0.5, 0.0, 1.0);
        float materialShadowThreshold = clamp(uShadowThreshold, 0.0, 1.0);
        float shadowWidth = (uShadowWidthOverride >= 0.0)
          ? uShadowWidthOverride
          : uShadowWidth;
        float toonLuma = clamp((uUseLambert > 0.5 ? halfNdl : 1.0) + (uUseValueTex > 0.5 ? hMask * 2.0 - 1.0 : 0.0), 0.0, 1.0);
        float officialShadowBand = sekaiBaseShadow(
          ndl,
          hMask,
          uUseLambert,
          uUseValueTex,
          materialShadowThreshold,
          shadowWidth,
          uFadeMode
        );
        float valueShadowInfluence = clamp(uValueShadowInfluence, 0.0, 1.0);
        float geometricShadowBand = sekaiBaseShadow(
          ndl,
          0.5,
          uUseLambert,
          0.0,
          materialShadowThreshold,
          shadowWidth,
          uFadeMode
        );
        float shadowBand = mix(geometricShadowBand, officialShadowBand, valueShadowInfluence) * uShadowWeight;
        float litBand = clamp(1.0 - shadowBand, 0.0, 1.0);

        vec3 adjustedMainColor = applyMaterialHsvc(mainColor);
        vec3 fallbackShadowColor = mainColor * uShadowColor;
        vec3 weightedShadowColor = uUseShadowTex > 0.5
          ? shadowValue
          : mix(adjustedMainColor, fallbackShadowColor, clamp(uShadowTexWeight, 0.0, 1.0));
        vec3 shadowColor = weightedShadowColor;
        if (uBodyDebugMode > 0.5 && uBodyDebugMode < 12.5) {
          float debugValue = skinMask;
          if (uBodyDebugMode > 1.5 && uBodyDebugMode < 2.5) {
            gl_FragColor = vec4(outputColor(clamp(mainColor, 0.0, 1.0)), 1.0);
            return;
          } else if (uBodyDebugMode > 2.5 && uBodyDebugMode < 3.5) {
            float debugSkinValue = mix(
              mainColor.r,
              shadowValue.r,
              clamp(shadowBand, 0.0, 1.0)
            );
            vec3 debugSkinColor = applyMaterialHsvc(sekaiSkinRamp(
              debugSkinValue,
              mix(vec3(1.0), uGlobalShadowColor, clamp(uGlobalShadowAlpha, 0.0, 1.0)),
              uSkinColorDefault,
              uSkinColor1,
              uSkinColor2
            ));
            gl_FragColor = vec4(outputColor(clamp(debugSkinColor, 0.0, 1.0)), 1.0);
            return;
          } else if (uBodyDebugMode > 3.5 && uBodyDebugMode < 4.5) {
            debugValue = valueSample.r;
          } else if (uBodyDebugMode > 4.5 && uBodyDebugMode < 5.5) {
            debugValue = valueSample.g;
          } else if (uBodyDebugMode > 5.5 && uBodyDebugMode < 6.5) {
            debugValue = valueSample.b;
          } else if (uBodyDebugMode > 6.5 && uBodyDebugMode < 7.5) {
            debugValue = valueSample.a;
          } else if (uBodyDebugMode > 7.5 && uBodyDebugMode < 8.5) {
            debugValue = vertexOutlineIntensity;
          } else if (uBodyDebugMode > 8.5 && uBodyDebugMode < 9.5) {
            debugValue = vertexRimMask;
          } else if (uBodyDebugMode > 9.5 && uBodyDebugMode < 10.5) {
            debugValue = shadowBand;
          } else if (uBodyDebugMode > 10.5 && uBodyDebugMode < 11.5) {
            debugValue = halfNdl;
          } else if (uBodyDebugMode > 11.5 && uBodyDebugMode < 12.5) {
            debugValue = officialShadowBand;
          }
          gl_FragColor = vec4(outputColor(vec3(debugValue)), 1.0);
          return;
        }
        if (uBodyDebugMode > 23.5 && uBodyDebugMode < 24.5) {
          gl_FragColor = vec4(outputColor(vec3(clamp(toonLuma, 0.0, 1.0))), 1.0);
          return;
        } else if (uBodyDebugMode > 24.5 && uBodyDebugMode < 25.5) {
          gl_FragColor = vec4(outputColor(vec3(clamp(1.0 - litBand, 0.0, 1.0))), 1.0);
          return;
        } else if (uBodyDebugMode > 25.5 && uBodyDebugMode < 26.5) {
          gl_FragColor = vec4(outputColor(clamp(shadowColor, 0.0, 1.0)), 1.0);
          return;
        }
        vec3 globalShadow = mix(
          vec3(1.0),
          uGlobalShadowColor,
          clamp(uGlobalShadowAlpha, 0.0, 1.0)
        );
        vec3 baseShadedColor = mix(
          adjustedMainColor,
          weightedShadowColor * globalShadow,
          shadowBand
        );
        float skinValue = mix(
          mainColor.r,
          shadowValue.r,
          clamp(shadowBand, 0.0, 1.0)
        );
        vec3 skinColor = applyMaterialHsvc(sekaiSkinRamp(
          skinValue,
          globalShadow,
          uSkinColorDefault,
          uSkinColor1,
          uSkinColor2
        ));
        vec3 color = mix(baseShadedColor, skinColor, skinMask);

        float halfLambert = clamp(dot(normal, normalize(lightDir + viewDir)), 0.0, 1.0);
        float specEnabled = step(0.0001, uSpecularPower);
        float specPower = 10.0 / max(uSpecularPower, 0.0001);
        float specMask = hAlpha * specEnabled;
        float specular = pow(halfLambert, specPower) * specMask;
        vec3 specularAdd =
          uControllerSpecularColor *
          uControllerSpecularIntensity *
          specular;

        float nDotV = clamp(dot(normal, viewDir), 0.0, 1.0);
        vec3 rimDirection = normalize(uRimDirection);
        float nDotRim = dot(normal, rimDirection);
        float vDotRim = clamp(dot(viewDir, rimDirection), 0.0, 1.0);
        float rimFactorX = max(uControllerRimRange, 0.0);
        rimFactorX = rimFactorX > 10.0 ? rimFactorX * 0.01 : rimFactorX;
        rimFactorX = min(rimFactorX, 10.0);
        float rimFactorY = max(uControllerRimEdgeSmoothness, 0.00001);
        float rimFactorW = clamp(uControllerRimLightInfluence, 0.0, 1.0);
        float viewFresnel = pow(
          1.0 - nDotV,
          max(10.0 - clamp(rimFactorX, 0.0, 10.0), 0.001)
        );
        float directedRim = viewFresnel * mix(1.0, vDotRim, rimFactorW);
        float sidedRim = nDotRim < 0.05
          ? directedRim
          : directedRim * (1.0 - 2.0 * rimFactorW);
        float rim = sekaiSmooth01(clamp(
          (sidedRim - uRimThreshold) / rimFactorY,
          0.0,
          1.0
        ));
        float rimMask = vertexRimMask;
        vec3 controllerRimBase = mix(
          vec3(0.5),
          uControllerRimColor,
          clamp(uControllerRimColorWeight, 0.0, 1.0)
        );
        vec3 controllerShadowRimBase = mix(
          controllerRimBase,
          uControllerShadowRimColor,
          clamp(uControllerShadowRimColorWeight, 0.0, 1.0)
        );
        float rimShadowSharpness = clamp(
          uControllerRimShadowSharpness,
          0.0,
          1.0
        );
        float rimColorMix = sekaiSmooth01(clamp(
          (nDotRim - (rimShadowSharpness - 1.0)) /
            max(2.0 * (1.0 - rimShadowSharpness), 0.00001),
          0.0,
          1.0
        ));
        vec3 rimColor = mix(
          controllerRimBase,
          controllerShadowRimBase,
          rimColorMix
        );
        float rimGate = rimMask * max(uRimColorAlpha, 0.0);
        float rimScalar = rim * rimGate;
        vec3 rimAdd = rimColor * rimScalar;
        if (uBodyDebugMode > 15.5 && uBodyDebugMode < 16.5) {
          gl_FragColor = vec4(outputColor(vec3(clamp(specular, 0.0, 1.0))), 1.0);
          return;
        } else if (uBodyDebugMode > 21.5 && uBodyDebugMode < 22.5) {
          gl_FragColor = vec4(outputColor(vec3(clamp(specMask, 0.0, 1.0))), 1.0);
          return;
        } else if (uBodyDebugMode > 22.5 && uBodyDebugMode < 23.5) {
          gl_FragColor = vec4(outputColor(clamp(specularAdd * 8.0, 0.0, 1.0)), 1.0);
          return;
        } else if (uBodyDebugMode > 16.5 && uBodyDebugMode < 17.5) {
          gl_FragColor = vec4(outputColor(vec3(clamp(rim, 0.0, 1.0))), 1.0);
          return;
        } else if (uBodyDebugMode > 17.5 && uBodyDebugMode < 18.5) {
          gl_FragColor = vec4(outputColor(clamp(rimAdd * 4.0, 0.0, 1.0)), 1.0);
          return;
        } else if (uBodyDebugMode > 18.5 && uBodyDebugMode < 19.5) {
          gl_FragColor = vec4(outputColor(vec3(clamp(rimGate * 4.0, 0.0, 1.0))), 1.0);
          return;
        } else if (uBodyDebugMode > 19.5 && uBodyDebugMode < 20.5) {
          gl_FragColor = vec4(outputColor(clamp(rimColor, 0.0, 1.0)), 1.0);
          return;
        } else if (uBodyDebugMode > 20.5 && uBodyDebugMode < 21.5) {
          gl_FragColor = vec4(outputColor(vec3(clamp(rimScalar * 8.0, 0.0, 1.0))), 1.0);
          return;
        }
        color += rimAdd;
        color += rimAdd * uControllerRimEmission;
        color += specularAdd;

        vec3 ambientTarget = sekaiApplyCharacterAmbient(
          color,
          uControllerAmbientColor,
          uControllerAmbientIntensity,
          vec4(uPartsAmbientColor, uPartsAmbientAlpha)
        );
        if (uBodyDebugMode > 12.5 && uBodyDebugMode < 13.5) {
          gl_FragColor = vec4(outputColor(clamp(ambientTarget, 0.0, 1.0)), 1.0);
          return;
        } else if (uBodyDebugMode > 13.5 && uBodyDebugMode < 14.5) {
          gl_FragColor = vec4(outputColor(vec3(clamp(uControllerAmbientIntensity, 0.0, 1.0))), 1.0);
          return;
        } else if (uBodyDebugMode > 14.5 && uBodyDebugMode < 15.5) {
          gl_FragColor = vec4(outputColor(clamp(uControllerAmbientColor, 0.0, 1.0)), 1.0);
          return;
        }
        color = ambientTarget;
        gl_FragColor = vec4(
          outputColor(clamp(color, 0.0, 1.0)),
          uUseMainTex > 0.5 ? mainSample.a : 1.0
        );
      }
    `
	});
}
function Re(e, t) {
	O(e.uniforms.uBaseColor.value, t.baseColor), O(e.uniforms.uShadowColor.value, t.shadowColor), O(e.uniforms.uSkinColorDefault.value, t.skinColorDefault ?? t.baseColor), O(e.uniforms.uSkinColor1.value, t.skinColor1 ?? t.shadowColor), O(e.uniforms.uSkinColor2.value, t.skinColor2 ?? t.skinColor1 ?? t.shadowColor), O(e.uniforms.uPartsAmbientColor.value, t.partsAmbientColor ?? "#ffffff"), e.uniforms.uPartsAmbientAlpha.value = t.partsAmbientAlpha ?? e.uniforms.uPartsAmbientAlpha.value, O(e.uniforms.uReflectionBlendColor.value, t.reflectionBlendColor ?? "#ffffff"), O(e.uniforms.uGlobalShadowColor.value, t.globalShadowColor ?? "#ffffff"), e.uniforms.uGlobalShadowAlpha.value = t.globalShadowAlpha ?? e.uniforms.uGlobalShadowAlpha.value, t.controllerAmbientColor !== void 0 && O(e.uniforms.uControllerAmbientColor.value, t.controllerAmbientColor), e.uniforms.uControllerAmbientIntensity.value = t.controllerAmbientIntensity ?? e.uniforms.uControllerAmbientIntensity.value, O(e.uniforms.uControllerSpecularColor.value, t.controllerSpecularColor ?? "#ffffff"), e.uniforms.uControllerSpecularIntensity.value = t.controllerSpecularIntensity ?? e.uniforms.uControllerSpecularIntensity.value, t.controllerRimColor !== void 0 && O(e.uniforms.uControllerRimColor.value, t.controllerRimColor), t.controllerShadowRimColor !== void 0 && O(e.uniforms.uControllerShadowRimColor.value, t.controllerShadowRimColor), e.uniforms.uControllerRimColorWeight.value = t.controllerRimColorWeight ?? e.uniforms.uControllerRimColorWeight.value, e.uniforms.uControllerShadowRimColorWeight.value = t.controllerShadowRimColorWeight ?? e.uniforms.uControllerShadowRimColorWeight.value, e.uniforms.uControllerRimRange.value = t.controllerRimRange ?? e.uniforms.uControllerRimRange.value, e.uniforms.uControllerRimEdgeSmoothness.value = t.controllerRimEdgeSmoothness ?? e.uniforms.uControllerRimEdgeSmoothness.value, e.uniforms.uControllerRimEmission.value = t.controllerRimEmission ?? e.uniforms.uControllerRimEmission.value, e.uniforms.uControllerRimLightInfluence.value = t.controllerRimLightInfluence ?? e.uniforms.uControllerRimLightInfluence.value, e.uniforms.uControllerRimShadowSharpness.value = t.controllerRimShadowSharpness ?? e.uniforms.uControllerRimShadowSharpness.value, t.bodyDebugMode !== void 0 && e.uniforms.uBodyDebugMode && (e.uniforms.uBodyDebugMode.value = t.bodyDebugMode), e.uniforms.uMainTex.value = t.mainTex ?? null, e.uniforms.uShadowTex.value = t.shadowTex ?? null, e.uniforms.uValueTex.value = t.valueTex ?? null, e.uniforms.uMainTexTransform.value = j(t.mainTex), e.uniforms.uUseMainTex.value = +!!t.mainTex, e.uniforms.uUseShadowTex.value = +!!t.shadowTex, e.uniforms.uHasValueTex.value = +!!t.valueTex, e.uniforms.uUseValueTex.value = t.useValueTex ?? !!t.valueTex ? 1 : 0, e.uniforms.uAlphaCutoff && (e.uniforms.uAlphaCutoff.value = t.alphaCutoff ?? 0), e.uniforms.uLightDirection.value.copy(t.lightDirection.clone().normalize()), e.uniforms.uLightIntensity.value = t.lightIntensity, e.uniforms.uAmbientIntensity.value = t.ambientIntensity, e.uniforms.uShadowThreshold.value = t.shadowThreshold, e.uniforms.uShadowWeight.value = t.shadowWeight, e.uniforms.uShadowWidth.value = t.shadowWidth ?? e.uniforms.uShadowWidth.value, t.shadowFade !== void 0 && e.uniforms.uShadowFade && (e.uniforms.uShadowFade.value = t.shadowFade), t.shadowWidthOverride !== void 0 && e.uniforms.uShadowWidthOverride && (e.uniforms.uShadowWidthOverride.value = t.shadowWidthOverride ?? -1), t.valueShadowInfluence !== void 0 && e.uniforms.uValueShadowInfluence && (e.uniforms.uValueShadowInfluence.value = t.valueShadowInfluence), t.hairShadowEnabled !== void 0 && e.uniforms.uHairShadowEnabled && (e.uniforms.uHairShadowEnabled.value = +!!t.hairShadowEnabled), t.useLambert !== void 0 && e.uniforms.uUseLambert && (e.uniforms.uUseLambert.value = +!!t.useLambert), t.headPosition && e.uniforms.uHeadPosition && e.uniforms.uHeadPosition.value.copy(t.headPosition), t.headNormalBlend !== void 0 && e.uniforms.uHeadNormalBlend && (e.uniforms.uHeadNormalBlend.value = t.headNormalBlend), e.uniforms.uCharacterAmbientIntensity.value = t.characterAmbientIntensity ?? .3, e.uniforms.uRimColorAlpha.value = t.rimColorAlpha ?? e.uniforms.uRimColorAlpha.value, e.uniforms.uRimDirection.value.copy((t.rimDirection ?? new y.Vector3(T.x, T.y, T.z)).clone().normalize()), e.uniforms.uSpecularPower.value = t.specularPower ?? 0, e.uniforms.uRimThreshold.value = t.rimThreshold ?? .2, e.uniforms.uShadowTexWeight.value = t.shadowTexWeight ?? 1, e.uniforms.uFadeMode && (e.uniforms.uFadeMode.value = t.fadeMode ?? e.uniforms.uFadeMode.value), e.uniforms.uHueSinAngle && (e.uniforms.uHueSinAngle.value = t.hueSinAngle ?? e.uniforms.uHueSinAngle.value), e.uniforms.uHueCosAngle && (e.uniforms.uHueCosAngle.value = t.hueCosAngle ?? e.uniforms.uHueCosAngle.value), e.uniforms.uSaturation.value = t.saturation ?? e.uniforms.uSaturation.value, e.uniforms.uValue && (e.uniforms.uValue.value = t.value ?? e.uniforms.uValue.value), e.uniforms.uContrast && (e.uniforms.uContrast.value = t.contrast ?? e.uniforms.uContrast.value);
}
function ze(e, t) {
	e.uniforms.uCameraPosition.value.copy(t);
}
function Be(e) {
	return new y.ShaderMaterial({
		defines: { USE_UV1: "" },
		transparent: !1,
		depthWrite: !0,
		side: y.FrontSide,
		uniforms: {
			uBaseColor: { value: k(e.baseColor) },
			uWarmColor: { value: k(e.warmColor) },
			uSkinColorDefault: { value: k(e.skinColorDefault ?? e.baseColor) },
			uSkinColor1: { value: k(e.skinColor1 ?? e.warmColor) },
			uSkinColor2: { value: k(e.skinColor2 ?? e.warmColor) },
			uMainTex: { value: e.mainTex ?? null },
			uShadowTex: { value: e.shadowTex ?? null },
			uValueTex: { value: e.valueTex ?? null },
			uFaceShadowTex: { value: e.faceShadowTex ?? null },
			uMainTexTransform: { value: j(e.mainTex) },
			uUseMainTex: { value: +!!e.mainTex },
			uUseShadowTex: { value: +!!e.shadowTex },
			uHasValueTex: { value: +!!e.valueTex },
			uUseValueTex: { value: e.useValueTex ?? !!e.valueTex ? 1 : 0 },
			uUseFaceShadowTex: { value: +!!e.faceShadowTex },
			uLightDirection: { value: e.lightDirection.clone().normalize() },
			uCameraPosition: { value: new y.Vector3() },
			uHeadDotDirectionalLight: { value: (e.headDotDirectionalLight ?? new y.Vector2(0, 0)).clone() },
			uUseFaceShadowLimiter: { value: e.useFaceShadowLimiter === !1 ? 0 : 1 },
			uFaceShadowLimitRange: { value: e.faceShadowLimitRange ?? 0 },
			uLightIntensity: { value: e.lightIntensity },
			uAmbientIntensity: { value: e.ambientIntensity },
			uFaceDebugMode: { value: e.faceDebugMode ?? 0 },
			uFaceSdfEnabled: { value: e.faceSdfEnabled && e.faceShadowTex ? 1 : 0 },
			uShadowThreshold: { value: e.shadowThreshold ?? .5 },
			uShadowWeight: { value: e.shadowWeight ?? 1 },
			uShadowWidth: { value: e.shadowWidth ?? 0 },
			uFadeMode: { value: e.fadeMode ?? 0 },
			uUseLambert: { value: e.useLambert === !1 ? 0 : 1 },
			uShadowTexWeight: { value: e.shadowTexWeight ?? 1 },
			uHueSinAngle: { value: e.hueSinAngle ?? 0 },
			uHueCosAngle: { value: e.hueCosAngle ?? 1 },
			uSaturation: { value: e.saturation ?? .5 },
			uValue: { value: e.value ?? .5 },
			uContrast: { value: e.contrast ?? .5 },
			uPartsAmbientColor: { value: k(e.partsAmbientColor ?? "#ffffff") },
			uPartsAmbientAlpha: { value: e.partsAmbientAlpha ?? 0 },
			uControllerAmbientColor: { value: A(e.controllerAmbientColor, E.ambientColor) },
			uControllerAmbientIntensity: { value: e.controllerAmbientIntensity ?? 1 },
			uControllerSpecularColor: { value: A(e.controllerSpecularColor, E.specularColor) },
			uControllerSpecularIntensity: { value: e.controllerSpecularIntensity ?? 1 },
			uControllerRimColor: { value: A(e.controllerRimColor, E.rimColor) },
			uControllerShadowRimColor: { value: A(e.controllerShadowRimColor, E.shadowRimColor) },
			uControllerRimColorWeight: { value: e.controllerRimColorWeight ?? 1 },
			uControllerShadowRimColorWeight: { value: e.controllerShadowRimColorWeight ?? 1 },
			uControllerRimRange: { value: e.controllerRimRange ?? E.rimRange },
			uControllerRimEdgeSmoothness: { value: e.controllerRimEdgeSmoothness ?? E.rimEdgeSmoothness },
			uControllerRimEmission: { value: e.controllerRimEmission ?? E.rimEmission },
			uControllerRimLightInfluence: { value: e.controllerRimLightInfluence ?? E.rimLightInfluence },
			uControllerRimShadowSharpness: { value: e.controllerRimShadowSharpness ?? E.rimShadowSharpness },
			uRimColorAlpha: { value: e.rimColorAlpha ?? E.rimColorAlpha },
			uRimDirection: { value: (e.rimDirection ?? new y.Vector3(T.x, T.y, T.z)).clone().normalize() },
			uSpecularPower: { value: e.specularPower ?? 0 },
			uRimThreshold: { value: e.rimThreshold ?? .2 },
			uGlobalShadowColor: { value: k(e.globalShadowColor ?? "#ffffff") },
			uGlobalShadowAlpha: { value: e.globalShadowAlpha ?? 1 },
			uAlphaCutoff: { value: e.alphaCutoff ?? 0 }
		},
		vertexColors: !0,
		vertexShader: "\n      #include <common>\n      #include <uv_pars_vertex>\n      #include <color_pars_vertex>\n      #include <skinning_pars_vertex>\n      #include <morphtarget_pars_vertex>\n\n      varying vec3 vWorldPosition;\n      varying vec3 vWorldNormal;\n      varying vec2 vUv;\n      varying vec2 vFaceShadowUv;\n\n      void main() {\n        #include <uv_vertex>\n        #include <color_vertex>\n        #include <beginnormal_vertex>\n        #include <morphnormal_vertex>\n        #include <skinbase_vertex>\n        #include <skinnormal_vertex>\n        #include <defaultnormal_vertex>\n        #include <begin_vertex>\n        #include <morphtarget_vertex>\n        #include <skinning_vertex>\n\n        vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);\n        vWorldPosition = worldPosition.xyz;\n        vWorldNormal = inverseTransformDirection(\n          transformedNormal,\n          viewMatrix\n        );\n        vUv = uv;\n        #ifdef USE_UV1\n          vFaceShadowUv = uv1;\n        #else\n          vFaceShadowUv = uv;\n        #endif\n        gl_Position = projectionMatrix * viewMatrix * worldPosition;\n      }\n    ",
		fragmentShader: `
      #include <common>
      #include <color_pars_fragment>

      uniform vec3 uBaseColor;
      uniform vec3 uWarmColor;
      uniform vec3 uSkinColorDefault;
      uniform vec3 uSkinColor1;
      uniform vec3 uSkinColor2;
      uniform sampler2D uMainTex;
      uniform sampler2D uShadowTex;
      uniform sampler2D uValueTex;
      uniform sampler2D uFaceShadowTex;
      uniform mat3 uMainTexTransform;
      uniform float uUseMainTex;
      uniform float uUseShadowTex;
      uniform float uHasValueTex;
      uniform float uUseValueTex;
      uniform float uUseFaceShadowTex;
      uniform vec3 uLightDirection;
      uniform vec3 uCameraPosition;
      uniform vec2 uHeadDotDirectionalLight;
      uniform float uUseFaceShadowLimiter;
      uniform float uFaceShadowLimitRange;
      uniform float uLightIntensity;
      uniform float uAmbientIntensity;
      uniform float uFaceDebugMode;
      uniform float uFaceSdfEnabled;
      uniform float uShadowThreshold;
      uniform float uShadowWeight;
      uniform float uShadowWidth;
      uniform float uFadeMode;
      uniform float uUseLambert;
      uniform float uShadowTexWeight;
      uniform float uHueSinAngle;
      uniform float uHueCosAngle;
      uniform float uSaturation;
      uniform float uValue;
      uniform float uContrast;
      uniform vec3 uPartsAmbientColor;
      uniform float uPartsAmbientAlpha;
      uniform vec3 uControllerAmbientColor;
      uniform float uControllerAmbientIntensity;
      uniform vec3 uControllerSpecularColor;
      uniform float uControllerSpecularIntensity;
      uniform vec3 uControllerRimColor;
      uniform vec3 uControllerShadowRimColor;
      uniform float uControllerRimColorWeight;
      uniform float uControllerShadowRimColorWeight;
      uniform float uControllerRimRange;
      uniform float uControllerRimEdgeSmoothness;
      uniform float uControllerRimEmission;
      uniform float uControllerRimLightInfluence;
      uniform float uControllerRimShadowSharpness;
      uniform float uRimColorAlpha;
      uniform vec3 uRimDirection;
      uniform float uSpecularPower;
      uniform float uRimThreshold;
      uniform vec3 uGlobalShadowColor;
      uniform float uGlobalShadowAlpha;
      uniform float uAlphaCutoff;

      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      varying vec2 vFaceShadowUv;

      ${Pe}
      ${Fe}
      ${Ie}

      vec3 outputColor(vec3 color) {
        return color;
      }

      void main() {
        vec2 mainUv = (uMainTexTransform * vec3(vUv, 1.0)).xy;
        vec2 faceShadowUv = vFaceShadowUv;
        vec4 mainSample = vec4(1.0);
        vec3 mainColor = uBaseColor;
        if (uUseMainTex > 0.5) {
          mainSample = sekaiGammaTexture(texture2D(uMainTex, mainUv));
          if (uAlphaCutoff > 0.0 && mainSample.a < uAlphaCutoff) {
            discard;
          }
          mainColor = mainSample.rgb;
        }

        vec3 sampledShadow = uUseShadowTex > 0.5
          ? sekaiGammaTexture(texture2D(uShadowTex, mainUv).rgb)
          : uWarmColor;
        vec3 shadowColor = mix(mainColor, sampledShadow, clamp(uShadowTexWeight, 0.0, 1.0));
        vec4 valueSample = vec4(0.0, 0.0, 0.5, 0.0);
        if (uHasValueTex > 0.5) {
          valueSample = texture2D(uValueTex, mainUv);
        }
        float skinMask = uHasValueTex > 0.5
          ? step(0.5, valueSample.r)
          : 0.0;
        float shadowBand = sekaiBaseShadow(
          dot(normalize(vWorldNormal), normalize(uLightDirection)),
          valueSample.b,
          uUseLambert,
          uUseValueTex,
          uShadowThreshold,
          uShadowWidth,
          uFadeMode
        ) * uShadowWeight;
        float sdfValue = 0.0;
        float faceThreshold = 0.0;
        float faceShadow = 0.0;
        if ((uFaceSdfEnabled > 0.5 || uFaceDebugMode > 0.5) && uUseFaceShadowTex > 0.5) {
          float sdf0 = texture2D(uFaceShadowTex, faceShadowUv).r;
          float sdf1 = texture2D(
            uFaceShadowTex,
            vec2(-faceShadowUv.x, faceShadowUv.y)
          ).r;
          sdfValue = uHeadDotDirectionalLight.x <= 0.0 ? sdf1 : sdf0;
          faceThreshold = uHeadDotDirectionalLight.y;
          if (uUseFaceShadowLimiter > 0.5) {
            faceThreshold = min(
              max((1.0 - abs(2.0 * uHeadDotDirectionalLight.y - 1.0)) * 0.5, 0.0),
              uFaceShadowLimitRange
            );
          }
          faceThreshold = clamp(faceThreshold, 0.0, 1.0);
          faceShadow = sekaiFaceShadow(sdfValue, faceThreshold, uShadowWidth, uFadeMode);
          if (uFaceDebugMode > 0.5) {
            if (uFaceDebugMode < 1.5) {
              gl_FragColor = vec4(outputColor(vec3(sdfValue)), 1.0);
              return;
            }
            if (uFaceDebugMode < 2.5) {
              gl_FragColor = vec4(outputColor(vec3(faceShadow)), 1.0);
              return;
            }
            if (uFaceDebugMode < 3.5) {
              gl_FragColor = vec4(outputColor(vec3(faceThreshold)), 1.0);
              return;
            }
            if (uFaceDebugMode < 4.5) {
              gl_FragColor = vec4(outputColor(vec3(
                max(uHeadDotDirectionalLight.x, 0.0),
                max(-uHeadDotDirectionalLight.x, 0.0),
                uHeadDotDirectionalLight.y
              )), 1.0);
              return;
            }
            gl_FragColor = vec4(outputColor(vec3(uHeadDotDirectionalLight.y)), 1.0);
            return;
          }
          if (uFaceSdfEnabled > 0.5) {
            shadowBand = max(shadowBand, faceShadow);
          }
        }
        vec3 adjustedMainColor = sekaiApplyHsvc(
          mainColor,
          uHueSinAngle,
          uHueCosAngle,
          uSaturation,
          uValue,
          uContrast
        );
        vec3 globalShadow = mix(
          vec3(1.0),
          uGlobalShadowColor,
          clamp(uGlobalShadowAlpha, 0.0, 1.0)
        );
        vec3 baseShadedColor = mix(
          adjustedMainColor,
          shadowColor * globalShadow,
          clamp(shadowBand, 0.0, 1.0)
        );
        float skinValue = mix(
          mainColor.r,
          mix(mainColor.r, sampledShadow.r, clamp(uShadowTexWeight, 0.0, 1.0)),
          clamp(shadowBand, 0.0, 1.0)
        );
        vec3 skinColor = sekaiApplyHsvc(
          sekaiSkinRamp(
            skinValue,
            globalShadow,
            uSkinColorDefault,
            uSkinColor1,
            uSkinColor2
          ),
          uHueSinAngle,
          uHueCosAngle,
          uSaturation,
          uValue,
          uContrast
        );
        vec3 color = mix(baseShadedColor, skinColor, skinMask);

        vec3 normal = normalize(vWorldNormal);
        vec3 lightDir = normalize(uLightDirection);
        vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
        float vertexRimMask = 1.0;
        #ifdef USE_COLOR
        vertexRimMask = clamp(vColor.g, 0.0, 1.0);
        #endif

        float halfLambert = clamp(
          dot(normal, normalize(lightDir + viewDir)),
          0.0,
          1.0
        );
        float specEnabled = step(0.0001, uSpecularPower);
        float specPower = 10.0 / max(uSpecularPower, 0.0001);
        float specular = pow(halfLambert, specPower) * valueSample.a * specEnabled;

        float nDotV = clamp(dot(normal, viewDir), 0.0, 1.0);
        vec3 rimDirection = normalize(uRimDirection);
        float nDotRim = dot(normal, rimDirection);
        float vDotRim = clamp(dot(viewDir, rimDirection), 0.0, 1.0);
        float rimRange = max(uControllerRimRange, 0.0);
        rimRange = rimRange > 10.0 ? rimRange * 0.01 : rimRange;
        rimRange = min(rimRange, 10.0);
        float rimSmoothness = max(uControllerRimEdgeSmoothness, 0.00001);
        float rimInfluence = clamp(uControllerRimLightInfluence, 0.0, 1.0);
        float viewFresnel = pow(
          1.0 - nDotV,
          max(10.0 - clamp(rimRange, 0.0, 10.0), 0.001)
        );
        float directedRim =
          viewFresnel * mix(1.0, vDotRim, rimInfluence);
        float sidedRim = nDotRim < 0.05
          ? directedRim
          : directedRim * (1.0 - 2.0 * rimInfluence);
        float rim = sekaiSmooth01(clamp(
          (sidedRim - uRimThreshold) / rimSmoothness,
          0.0,
          1.0
        ));
        vec3 controllerRimBase = mix(
          vec3(0.5),
          uControllerRimColor,
          clamp(uControllerRimColorWeight, 0.0, 1.0)
        );
        vec3 controllerShadowRimBase = mix(
          controllerRimBase,
          uControllerShadowRimColor,
          clamp(uControllerShadowRimColorWeight, 0.0, 1.0)
        );
        float rimShadowSharpness = clamp(
          uControllerRimShadowSharpness,
          0.0,
          1.0
        );
        float rimColorMix = sekaiSmooth01(clamp(
          (nDotRim - (rimShadowSharpness - 1.0)) /
            max(2.0 * (1.0 - rimShadowSharpness), 0.00001),
          0.0,
          1.0
        ));
        vec3 rimColor = mix(
          controllerRimBase,
          controllerShadowRimBase,
          rimColorMix
        );
        vec3 rimAdd = rimColor *
          rim *
          vertexRimMask *
          max(uRimColorAlpha, 0.0);
        color += rimAdd;
        color += rimAdd * uControllerRimEmission;
        color +=
          uControllerSpecularColor *
          uControllerSpecularIntensity *
          specular;

        color = sekaiApplyCharacterAmbient(
          color,
          uControllerAmbientColor,
          uControllerAmbientIntensity,
          vec4(uPartsAmbientColor, uPartsAmbientAlpha)
        );
        gl_FragColor = vec4(
          outputColor(clamp(color, 0.0, 1.0)),
          uUseMainTex > 0.5 ? mainSample.a : 1.0
        );
      }
    `
	});
}
function Ve(e, t) {
	O(e.uniforms.uBaseColor.value, t.baseColor), O(e.uniforms.uWarmColor.value, t.warmColor), O(e.uniforms.uSkinColorDefault.value, t.skinColorDefault ?? t.baseColor), O(e.uniforms.uSkinColor1.value, t.skinColor1 ?? t.warmColor), O(e.uniforms.uSkinColor2.value, t.skinColor2 ?? t.warmColor), e.uniforms.uMainTex.value = t.mainTex ?? null, e.uniforms.uShadowTex.value = t.shadowTex ?? null, e.uniforms.uValueTex.value = t.valueTex ?? null, e.uniforms.uFaceShadowTex.value = t.faceShadowTex ?? null, e.uniforms.uMainTexTransform.value = j(t.mainTex), e.uniforms.uUseMainTex.value = +!!t.mainTex, e.uniforms.uUseShadowTex.value = +!!t.shadowTex, e.uniforms.uHasValueTex.value = +!!t.valueTex, e.uniforms.uUseValueTex.value = t.useValueTex ?? !!t.valueTex ? 1 : 0, e.uniforms.uUseFaceShadowTex.value = +!!t.faceShadowTex, e.uniforms.uLightDirection.value.copy(t.lightDirection.clone().normalize()), He(e, t.lightDirection, t.headDotDirectionalLight ?? e.uniforms.uHeadDotDirectionalLight?.value, t.useFaceShadowLimiter, t.faceShadowLimitRange), e.uniforms.uLightIntensity.value = t.lightIntensity, e.uniforms.uAmbientIntensity.value = t.ambientIntensity, e.uniforms.uShadowThreshold.value = t.shadowThreshold ?? e.uniforms.uShadowThreshold.value, e.uniforms.uShadowWeight.value = t.shadowWeight ?? e.uniforms.uShadowWeight.value, e.uniforms.uShadowWidth.value = t.shadowWidth ?? e.uniforms.uShadowWidth.value, e.uniforms.uFadeMode.value = t.fadeMode ?? e.uniforms.uFadeMode.value, e.uniforms.uUseLambert.value = t.useLambert === !1 ? 0 : 1, e.uniforms.uShadowTexWeight.value = t.shadowTexWeight ?? e.uniforms.uShadowTexWeight.value, e.uniforms.uHueSinAngle.value = t.hueSinAngle ?? e.uniforms.uHueSinAngle.value, e.uniforms.uHueCosAngle.value = t.hueCosAngle ?? e.uniforms.uHueCosAngle.value, e.uniforms.uSaturation.value = t.saturation ?? e.uniforms.uSaturation.value, e.uniforms.uValue.value = t.value ?? e.uniforms.uValue.value, e.uniforms.uContrast.value = t.contrast ?? e.uniforms.uContrast.value, O(e.uniforms.uPartsAmbientColor.value, t.partsAmbientColor ?? "#ffffff"), e.uniforms.uPartsAmbientAlpha.value = t.partsAmbientAlpha ?? e.uniforms.uPartsAmbientAlpha.value, t.controllerAmbientColor !== void 0 && O(e.uniforms.uControllerAmbientColor.value, t.controllerAmbientColor), e.uniforms.uControllerAmbientIntensity.value = t.controllerAmbientIntensity ?? e.uniforms.uControllerAmbientIntensity.value, t.controllerSpecularColor !== void 0 && O(e.uniforms.uControllerSpecularColor.value, t.controllerSpecularColor), e.uniforms.uControllerSpecularIntensity.value = t.controllerSpecularIntensity ?? e.uniforms.uControllerSpecularIntensity.value, t.controllerRimColor !== void 0 && O(e.uniforms.uControllerRimColor.value, t.controllerRimColor), t.controllerShadowRimColor !== void 0 && O(e.uniforms.uControllerShadowRimColor.value, t.controllerShadowRimColor), e.uniforms.uControllerRimColorWeight.value = t.controllerRimColorWeight ?? e.uniforms.uControllerRimColorWeight.value, e.uniforms.uControllerShadowRimColorWeight.value = t.controllerShadowRimColorWeight ?? e.uniforms.uControllerShadowRimColorWeight.value, e.uniforms.uControllerRimRange.value = t.controllerRimRange ?? e.uniforms.uControllerRimRange.value, e.uniforms.uControllerRimEdgeSmoothness.value = t.controllerRimEdgeSmoothness ?? e.uniforms.uControllerRimEdgeSmoothness.value, e.uniforms.uControllerRimEmission.value = t.controllerRimEmission ?? e.uniforms.uControllerRimEmission.value, e.uniforms.uControllerRimLightInfluence.value = t.controllerRimLightInfluence ?? e.uniforms.uControllerRimLightInfluence.value, e.uniforms.uControllerRimShadowSharpness.value = t.controllerRimShadowSharpness ?? e.uniforms.uControllerRimShadowSharpness.value, e.uniforms.uRimColorAlpha.value = t.rimColorAlpha ?? e.uniforms.uRimColorAlpha.value, t.rimDirection && e.uniforms.uRimDirection.value.copy(t.rimDirection).normalize(), e.uniforms.uSpecularPower.value = t.specularPower ?? e.uniforms.uSpecularPower.value, e.uniforms.uRimThreshold.value = t.rimThreshold ?? e.uniforms.uRimThreshold.value, O(e.uniforms.uGlobalShadowColor.value, t.globalShadowColor ?? "#ffffff"), e.uniforms.uGlobalShadowAlpha.value = t.globalShadowAlpha ?? e.uniforms.uGlobalShadowAlpha.value, e.uniforms.uAlphaCutoff.value = t.alphaCutoff ?? e.uniforms.uAlphaCutoff.value, t.faceDebugMode !== void 0 && (e.uniforms.uFaceDebugMode.value = t.faceDebugMode), e.uniforms.uFaceSdfEnabled && (e.uniforms.uFaceSdfEnabled.value = t.faceSdfEnabled && t.faceShadowTex ? 1 : 0);
}
function He(e, t, n, r = !0, i = 0) {
	e.uniforms.uLightDirection?.value.copy(t).normalize(), n && e.uniforms.uHeadDotDirectionalLight && e.uniforms.uHeadDotDirectionalLight.value.copy(n), e.uniforms.uUseFaceShadowLimiter && (e.uniforms.uUseFaceShadowLimiter.value = +!!r), e.uniforms.uFaceShadowLimitRange && (e.uniforms.uFaceShadowLimitRange.value = i);
}
function M(e, t = "alpha", n, r) {
	let i = t === "add" || t === "eyelight", a = t === "eyelight", o = n && n.tileX > 0 ? n.tileX : 1, s = n && n.tileY > 0 ? n.tileY : 1, c = Math.max(0, n?.sample ?? 0), l = (r?.vertexBViewOffset ?? 0) > 0, u = new y.ShaderMaterial({
		transparent: !0,
		depthWrite: !1,
		depthTest: !0,
		depthFunc: y.LessEqualDepth,
		side: y.DoubleSide,
		vertexColors: l,
		blending: i ? y.CustomBlending : y.NormalBlending,
		...i ? {
			blendSrc: y.SrcAlphaFactor,
			blendDst: y.OneFactor,
			blendEquation: y.AddEquation
		} : {},
		polygonOffset: !0,
		polygonOffsetFactor: a ? -.5 : -1,
		polygonOffsetUnits: a ? -.5 : -1,
		uniforms: {
			uMainTex: { value: e },
			uMainTexTransform: { value: j(e) },
			uUseMainTex: { value: +!!e },
			uMode: { value: t === "eye" ? 1 : a ? 2 : 0 },
			uTintColor: { value: k(r?.tintColor ?? "#ffffff") },
			uEmissionColor: { value: k(r?.emissionColor ?? "#000000") },
			uAtlasTile: { value: new y.Vector2(o, s) },
			uAtlasSample: { value: c },
			uUseAtlas: { value: 0 },
			uTime: { value: 0 },
			uLightInfluence: { value: y.MathUtils.clamp(r?.lightInfluence ?? 1, 0, 1) },
			uHighlightInfluence: { value: y.MathUtils.clamp(r?.highlightInfluence ?? 1, 0, 1) },
			uVertexBViewOffset: { value: Math.max(0, r?.vertexBViewOffset ?? 0) },
			uDistortionFps: { value: Math.max(1, r?.distortionFps ?? 12) },
			uDistortionIntensity: { value: Math.max(0, r?.distortionIntensity ?? +!!a) },
			uDistortionIntensityXY: { value: new y.Vector2(Math.max(0, r?.distortionIntensityX ?? +!!a), Math.max(0, r?.distortionIntensityY ?? +!!a)) },
			uDistortionOffset: { value: new y.Vector2(r?.distortionOffsetX ?? 0, r?.distortionOffsetY ?? 0) },
			uDistortionScroll: { value: new y.Vector2(r?.distortionScrollX ?? .5, r?.distortionScrollY ?? .5) },
			uDistortionScrollSpeed: { value: r?.distortionScrollSpeed ?? 1 },
			uDistortionTexTiling: { value: new y.Vector2(Math.max(.001, r?.distortionTexTilingX ?? 1), Math.max(.001, r?.distortionTexTilingY ?? 1)) },
			uThreshold: { value: y.MathUtils.clamp(r?.threshold ?? .5, 0, 1) },
			uAlphaScale: { value: y.MathUtils.clamp(r?.alphaScale ?? 1, 0, 1) },
			uAlphaCutoff: { value: y.MathUtils.clamp(r?.alphaCutoff ?? .001, 0, 1) },
			uStrictAlpha: { value: +!!r?.strictAlpha },
			uAlphaSource: { value: 0 }
		},
		vertexShader: "\n      #include <common>\n      #include <uv_pars_vertex>\n      #include <color_pars_vertex>\n      #include <skinning_pars_vertex>\n      #include <morphtarget_pars_vertex>\n\n      uniform float uVertexBViewOffset;\n\n      varying vec2 vUv;\n      varying vec3 vViewNormal;\n\n      void main() {\n        #include <uv_vertex>\n        #include <color_vertex>\n        #include <beginnormal_vertex>\n        #include <morphnormal_vertex>\n        #include <skinbase_vertex>\n        #include <skinnormal_vertex>\n        #include <defaultnormal_vertex>\n        #include <begin_vertex>\n        #include <morphtarget_vertex>\n        #include <skinning_vertex>\n\n        vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);\n        #ifdef USE_COLOR\n        mvPosition.z += clamp(vColor.b, 0.0, 1.0) * uVertexBViewOffset;\n        #endif\n        vUv = uv;\n        vViewNormal = normalize(normalMatrix * objectNormal);\n        gl_Position = projectionMatrix * mvPosition;\n      }\n    ",
		fragmentShader: `
      #include <common>

      uniform sampler2D uMainTex;
      uniform mat3 uMainTexTransform;
      uniform float uUseMainTex;
      uniform float uMode;
      uniform vec3 uTintColor;
      uniform vec3 uEmissionColor;
      uniform vec2 uAtlasTile;
      uniform float uAtlasSample;
      uniform float uUseAtlas;
      uniform float uTime;
      uniform float uLightInfluence;
      uniform float uHighlightInfluence;
      uniform float uDistortionFps;
      uniform float uDistortionIntensity;
      uniform vec2 uDistortionIntensityXY;
      uniform vec2 uDistortionOffset;
      uniform vec2 uDistortionScroll;
      uniform float uDistortionScrollSpeed;
      uniform vec2 uDistortionTexTiling;
      uniform float uThreshold;
      uniform float uAlphaScale;
      uniform float uAlphaCutoff;
      uniform float uStrictAlpha;
      uniform float uAlphaSource;

      varying vec2 vUv;
      varying vec3 vViewNormal;

      ${Ie}

      vec3 outputColor(vec3 color) {
        return color;
      }

      void main() {
        vec2 uv = (uMainTexTransform * vec3(vUv, 1.0)).xy;
        if (uUseAtlas > 0.5) {
          vec2 tile = max(uAtlasTile, vec2(1.0));
          float sampleIndex = floor(max(uAtlasSample, 0.0));
          float tileX = mod(sampleIndex, tile.x);
          float tileY = floor(sampleIndex / tile.x);
          uv = (uv + vec2(tileX, tileY)) / tile;
        }
        if (uMode > 1.5) {
          float steppedTime = floor(uTime * uDistortionFps) / uDistortionFps;
          vec2 distortionUv = uv * uDistortionTexTiling
            + uDistortionOffset
            + uDistortionScroll * steppedTime * uDistortionScrollSpeed;
          vec2 proceduralDistortion = vec2(
            sin((distortionUv.x + distortionUv.y) * 6.2831853),
            cos((distortionUv.x - distortionUv.y) * 6.2831853)
          ) * 0.5 + vec2(
            sin(distortionUv.y * 12.5663706 + steppedTime),
            cos(distortionUv.x * 12.5663706 - steppedTime)
          ) * 0.25;
          float edge = 1.0 - clamp(abs(vViewNormal.z), 0.0, 1.0);
          vec2 normalDrift = normalize(vViewNormal.xy + vec2(0.0001)) * edge * 0.0045;
          vec2 distortion = proceduralDistortion * uDistortionIntensityXY * 0.0032 * uDistortionIntensity;
          uv += (normalDrift + distortion) * mix(0.25, 1.0, uHighlightInfluence);
        }
        vec4 sampleColor = uUseMainTex > 0.5
          ? sekaiGammaTexture(texture2D(uMainTex, uv))
          : vec4(1.0);
        float textureAlpha = sampleColor.a;
        float alpha = uAlphaSource > 1.5
          ? sampleColor.r
          : (uAlphaSource > 0.5 ? 1.0 : textureAlpha);
        if (uAlphaSource > 1.5 && sampleColor.r < uThreshold) {
          discard;
        }
        if (uAlphaSource < 0.5 && uMode > 1.5 && uStrictAlpha < 0.5) {
          float brightness = max(max(sampleColor.r, sampleColor.g), sampleColor.b);
          float alphaLow = mix(0.06, 0.16, uThreshold);
          float alphaHigh = mix(0.32, 0.55, uThreshold);
          float brightnessMask = smoothstep(alphaLow, alphaHigh, brightness);
          alpha = textureAlpha * brightnessMask;
        }
        if (alpha < max(uAlphaCutoff, 0.001)) {
          discard;
        }
        alpha *= uAlphaScale;
        if (alpha < 0.001) {
          discard;
        }
        vec3 color = sampleColor.rgb * uTintColor + uEmissionColor;
        if (uMode > 0.5 && uMode < 1.5) {
          color *= mix(1.0, 1.04, uLightInfluence);
        }
        if (uMode > 1.5) {
          float brightness = max(max(sampleColor.r, sampleColor.g), sampleColor.b);
          color = max(color, vec3(brightness) * uTintColor);
          color *= 1.05 + alpha * mix(0.65, 1.05, uHighlightInfluence);
          if (uAlphaSource < 0.5) {
            alpha = clamp(alpha * mix(1.1, 1.55, uHighlightInfluence), 0.0, 1.0);
          }
        }
        gl_FragColor = vec4(outputColor(clamp(color, 0.0, 1.0)), alpha);
      }
    `
	});
	return u.forceSinglePass = !0, u;
}
//#endregion
//#region src/engine/sekaiExtraBoneRuntime.ts
var Ue = Math.PI / 180, We = [
	"XYZ",
	"XZY",
	"YXZ",
	"YZX",
	"ZXY",
	"ZYX"
], Ge = class e {
	entries;
	sourceUnityQuaternion = new y.Quaternion();
	sourceUnityEuler = new y.Euler();
	targetUnityEuler = new y.Euler();
	targetUnityQuaternion = new y.Quaternion();
	targetQuaternion = new y.Quaternion();
	constructor(e) {
		this.entries = e;
	}
	static fromPjskRuntimeExtension(t, n) {
		let r = qe(t);
		if (!r.length) return null;
		n.updateMatrixWorld(!0);
		let i = Ze(n), a = [];
		for (let e of r) {
			let t = e.GameObject ?? e.gameObject ?? null, n = e.ReferenceBone ?? e.referenceBone ?? null, r = et(i, at(t?.TransformPath ?? t?.transformPath), at(t?.Name ?? t?.name)), o = et(i, at(n?.TransformPath ?? n?.transformPath), at(n?.Name ?? n?.name));
			if (!r || !o) continue;
			let s = We[it(e.RotationOrder ?? e.rotationOrder, 4)] ?? "ZXY";
			a.push({
				node: r,
				referenceNode: o,
				coefficient: it(e.Coefficient ?? e.coefficient, 1),
				defaultQuaternion: Je(e),
				axisX: ot(e.AxisX ?? e.axisX, !0),
				axisY: ot(e.AxisY ?? e.axisY, !0),
				axisZ: ot(e.AxisZ ?? e.axisZ, !0),
				order: s
			});
		}
		return a.sort((e, t) => nt(e.referenceNode) - nt(t.referenceNode)), a.length ? new e(a) : null;
	}
	update() {
		for (let e of this.entries) {
			this.sourceUnityQuaternion.set(e.referenceNode.quaternion.x, -e.referenceNode.quaternion.y, -e.referenceNode.quaternion.z, e.referenceNode.quaternion.w).normalize(), this.sourceUnityEuler.setFromQuaternion(this.sourceUnityQuaternion, "ZXY"), Ye(this.sourceUnityEuler);
			let t = e.coefficient > 0 ? -1 : +(e.coefficient < 0);
			this.targetUnityEuler.set(0, 0, 0, e.order), e.axisX && (this.targetUnityEuler.x = this.sourceUnityEuler.x * t), e.axisY && (this.targetUnityEuler.y = this.sourceUnityEuler.y * t), e.axisZ && (this.targetUnityEuler.z = this.sourceUnityEuler.z * t), this.targetUnityQuaternion.setFromEuler(this.targetUnityEuler), this.targetQuaternion.copy(r(this.targetUnityQuaternion)), Ke(e.node.quaternion, e.defaultQuaternion, this.targetQuaternion, Math.abs(e.coefficient)), e.node.updateMatrix(), e.node.updateMatrixWorld(!0);
		}
	}
	getControlledTrackNodeNames() {
		return new Set(this.entries.map((e) => e.node.name).filter(Boolean));
	}
};
function Ke(e, t, n, r) {
	let i = y.MathUtils.clamp(r, 0, 1), a = t.dot(n) < 0 ? -1 : 1;
	return e.set(y.MathUtils.lerp(t.x, n.x * a, i), y.MathUtils.lerp(t.y, n.y * a, i), y.MathUtils.lerp(t.z, n.z * a, i), y.MathUtils.lerp(t.w, n.w * a, i)).normalize();
}
function qe(e) {
	let t = N(e), n = N(t?.pjskSpringBone ?? t?.PjskSpringBone), r = N(n?.raw ?? n?.Raw), i = [];
	for (let e of [r?.body ?? r?.Body, r?.head ?? r?.Head]) {
		let t = N(e), n = t?.extraBones ?? t?.ExtraBones;
		Array.isArray(n) && i.push(...n.filter(rt));
	}
	return i;
}
function Je(e) {
	let t = N(e.DefaultEulerAngles ?? e.defaultEulerAngles) ?? {}, n = it(t.X ?? t.x, 0), i = it(t.Y ?? t.y, 0), a = it(t.Z ?? t.z, 0);
	return r(new y.Quaternion().setFromEuler(new y.Euler(n * Ue, i * Ue, a * Ue, "ZXY")));
}
function Ye(e) {
	return e.x = Xe(e.x), e.y = Xe(e.y), e.z = Xe(e.z), e;
}
function Xe(e) {
	let t = Math.PI * 2;
	return (e % t + t) % t;
}
function Ze(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
	return e.traverse((r) => {
		if (r !== e) {
			let e = n.get(r.name) ?? [];
			e.push(r), n.set(r.name, e);
		}
		for (let n of Qe(e, r)) t.set(n, r);
	}), {
		nodeByPath: t,
		nodeByName: n
	};
}
function Qe(e, t) {
	let n = $e(t, e);
	if (!n) return [];
	let r = [n];
	return n.startsWith("body/") && r.push(`sit_body/${n.slice(5)}`), r;
}
function $e(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(r.name), r = r.parent;
	return n.join("/");
}
function et(e, t, n) {
	for (let n of tt(t)) {
		let t = e.nodeByPath.get(n);
		if (t) return t;
	}
	return n ? e.nodeByName.get(n)?.[0] ?? null : null;
}
function tt(e) {
	if (!e) return [];
	let t = [e];
	return e.startsWith("sit_body/") && t.push(`body/${e.slice(9)}`), t;
}
function nt(e) {
	let t = 0, n = e.parent;
	for (; n;) t += 1, n = n.parent;
	return t;
}
function N(e) {
	return e && typeof e == "object" ? e : null;
}
function rt(e) {
	return !!N(e);
}
function it(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function at(e) {
	return typeof e == "string" ? e : null;
}
function ot(e, t) {
	return typeof e == "boolean" ? e : typeof e == "number" ? e !== 0 : t;
}
//#endregion
//#region src/costume_shop/cameraPolicy.ts
var st = new y.Vector3(.04835, .48222, .07241), ct = new y.Vector3(-.08532, .12848, 1.93551), lt = 35, ut = -.0245, dt = .765, P = {
	zoomDuration: .35,
	bottomLowerLimitPosition: .4,
	bottomUpperLimitPosition: .85,
	topLowerLimitPosition: 1.25,
	topUpperLimitPosition: .85,
	nearZ: 2.3,
	farZ: 4.5,
	fov: 25
};
function ft(e) {
	let t = st.clone().multiplyScalar(e);
	return {
		target: t,
		position: t.clone().add(ct.clone().multiplyScalar(e)),
		fov: lt,
		costumeShopState: null
	};
}
function pt(e, t = 0) {
	let n = Number.isFinite(t) ? t : 0, r = e === "official-default" ? {
		cameraRootYawDegrees: n,
		zoomValue: 0,
		zoomMoveValue: 1
	} : {
		cameraRootYawDegrees: n,
		zoomValue: P.zoomDuration,
		zoomMoveValue: 0
	}, i = y.MathUtils.clamp(r.zoomValue, 0, P.zoomDuration), a = P.zoomDuration > 0 ? i / P.zoomDuration : 0, o = y.MathUtils.lerp(P.bottomLowerLimitPosition, P.bottomUpperLimitPosition, a), s = y.MathUtils.lerp(P.topLowerLimitPosition, P.topUpperLimitPosition, a), c = y.MathUtils.clamp(r.zoomMoveValue, 0, 1), l = e === "full-body" ? dt : y.MathUtils.lerp(o, s, c), u = y.MathUtils.lerp(P.nearZ, P.farZ, a), d = y.MathUtils.degToRad(r.cameraRootYawDegrees), f = new y.Vector3(0, l, u);
	return {
		target: new y.Vector3(0, l, 0),
		position: f.clone().applyAxisAngle(new y.Vector3(0, 1, 0), d),
		fov: P.fov,
		costumeShopState: {
			cameraRootYawDegrees: r.cameraRootYawDegrees,
			zoomValue: i,
			zoomMoveValue: c,
			zoomRatio: a,
			localCameraPosition: f,
			localCameraRotationYDegrees: 180
		}
	};
}
function mt(e, t, n, r) {
	let i = t.clone().sub(e).normalize(), a = new y.Vector3().crossVectors(i, new y.Vector3(0, 1, 0)).normalize().multiplyScalar(ut * n * r);
	return {
		target: t.clone().add(a),
		position: e.clone().add(a)
	};
}
//#endregion
//#region src/engine/captureBackground.ts
function ht(e, t) {
	let n = _t(e, t), r = new y.CanvasTexture(n);
	return r.colorSpace = y.SRGBColorSpace, r;
}
function gt(e) {
	let t = e >>> 0;
	return () => (t = t * 1664525 + 1013904223 >>> 0, t / 4294967296);
}
function _t(e, t) {
	let n = document.createElement("canvas");
	n.width = e, n.height = t;
	let r = n.getContext("2d");
	if (!r) return n;
	let i = r.createLinearGradient(0, t, e, 0);
	i.addColorStop(0, "#f9fffe"), i.addColorStop(.52, "#edfaff"), i.addColorStop(1, "#fff8fe"), r.fillStyle = i, r.fillRect(0, 0, e, t);
	let a = r.createLinearGradient(0, 0, e, t);
	a.addColorStop(0, "rgba(255, 246, 252, 0.34)"), a.addColorStop(1, "rgba(219, 246, 255, 0.40)"), r.fillStyle = a, r.fillRect(0, 0, e, t), r.fillStyle = "rgba(255, 255, 255, 0.48)", r.fillRect(0, 0, e, t);
	let o = gt(e * 73856093 ^ t * 19349663), s = [
		[
			166,
			236,
			255
		],
		[
			214,
			206,
			255
		],
		[
			255,
			204,
			238
		],
		[
			255,
			237,
			182
		]
	], c = e / Math.max(t, 1), l = Math.min(.12, Math.max(0, (c - 1) * .08)), u = (e, t, n, i, a, o) => {
		r.save(), r.translate(e, t), r.rotate(n), r.beginPath();
		for (let e = 0; e < 3; e += 1) {
			let t = -Math.PI / 2 + e * Math.PI * 2 / 3, n = Math.cos(t) * i * .56, a = Math.sin(t) * i * .56;
			e === 0 ? r.moveTo(n, a) : r.lineTo(n, a);
		}
		r.closePath(), r.fillStyle = `rgba(${a[0]}, ${a[1]}, ${a[2]}, ${o})`, r.fill(), r.restore();
	}, d = (n, r) => {
		for (let i = 0; i < n; i += 1) {
			let n = o(), i, a;
			if (n < .78) {
				let n = o();
				n < .26 ? (i = (-.04 + o() * .22) * e, a = o() * t) : n < .5 ? (i = (.82 - l + o() * (.21 + l)) * e, a = o() * t) : n < .78 ? (i = o() * e, a = (-.04 + o() * (.24 + l * .5)) * t) : (i = o() * e, a = (.8 - l * .8 + o() * (.23 + l * .8)) * t);
			} else i = (.12 + o() * .76) * e, a = (.12 + o() * .76) * t;
			let c = (i - e * .5) / e * 2, d = (a - t * .5) / t * 2, f = Math.max(.28, c * c + d * d), p = r * (.72 + o() * .46) * f, m = (.08 + o() * .13) * Math.min(1.25, f + .25);
			u(i, a, o() * Math.PI * 2, p, s[Math.floor(o() * s.length)], m);
		}
	}, f = Math.min(e, t) / 1e3;
	return d(Math.max(8, Math.round(18 * f)), 150 * f), d(Math.max(24, Math.round(80 * f)), 72 * f), n;
}
//#endregion
//#region src/engine/projectedShadow.ts
var vt = ["Left_Toe", "Right_Toe"], yt = .015, bt = .01, xt = {
	width: .72,
	height: 1.06,
	opacity: .28,
	crossSize: .46,
	crossOpacity: .22,
	floorY: 0,
	adjustShadow: !1,
	adjustAlpha: !0,
	invisibleHeight: .2,
	directionalShadow: !1
}, St = class {
	group = new y.Group();
	defaultDirection = new y.Vector3(-.35, 0, .94).normalize();
	settings = { ...xt };
	pairs = [];
	constructor() {
		let e = Ct();
		for (let t of vt) {
			let n = this.createShadowMaterial(e, this.settings.opacity), r = this.createShadowMaterial(e, this.settings.crossOpacity), i = new y.Group(), a = new y.Group(), o = new y.Mesh(new y.PlaneGeometry(1, 1), n);
			o.name = `CharacterDirectionalShadow_${t}`, o.rotation.x = -Math.PI / 2, o.renderOrder = -100, o.scale.set(this.settings.width, this.settings.height, 1), i.add(o);
			let s = new y.Mesh(new y.PlaneGeometry(1, 1), r);
			s.name = `CharacterCrossShadow_${t}`, s.rotation.x = -Math.PI / 2, s.renderOrder = -99, s.scale.set(this.settings.crossSize, this.settings.crossSize, 1), a.add(s), i.visible = this.settings.directionalShadow, a.visible = !this.settings.directionalShadow, this.group.add(i, a), this.pairs.push({
				targetWorldPosition: new y.Vector3(),
				initialToeHeight: null,
				directionalAnchor: i,
				crossAnchor: a,
				directionalMaterial: n,
				crossMaterial: r,
				directionalAlpha: this.settings.opacity
			});
		}
		this.group.name = "CharacterProjectedShadow", this.group.visible = !1;
	}
	setSettings(e = {}) {
		this.settings = wt(e, this.settings);
		for (let e of this.pairs) e.directionalAnchor.children[0]?.scale.set(this.settings.width, this.settings.height, 1), e.crossAnchor.children[0]?.scale.set(this.settings.crossSize, this.settings.crossSize, 1), e.directionalAnchor.visible = this.settings.directionalShadow, e.crossAnchor.visible = !this.settings.directionalShadow;
	}
	update(e) {
		let t = e.targetWorldPositions;
		if (this.group.visible = e.visible && t.length > 0, !this.group.visible) {
			for (let e of this.pairs) e.initialToeHeight = null, e.targetWorldPosition.set(0, 0, 0);
			return;
		}
		for (let [n, r] of this.pairs.entries()) {
			let i = t[n];
			if (!i) {
				r.directionalAnchor.visible = !1, r.crossAnchor.visible = !1, r.initialToeHeight = null, r.targetWorldPosition.set(0, 0, 0);
				continue;
			}
			r.targetWorldPosition.copy(i), r.initialToeHeight ??= i.y, r.directionalAnchor.visible = this.settings.directionalShadow, r.crossAnchor.visible = !this.settings.directionalShadow;
			let a = this.resolveDirection(i, e.lightWorldPosition), o = (i.y - this.settings.floorY) / Math.max(.001, e.characterModelScale), s = this.settings.height * o, c = i.x + a.x * s, l = i.z + a.z * s;
			r.directionalAnchor.position.set(this.settings.adjustShadow ? i.x : c, this.settings.floorY + bt, this.settings.adjustShadow ? i.z : l), r.directionalAnchor.rotation.y = Math.atan2(a.x, a.z), r.directionalAlpha = this.calculateDirectionalAlpha(r, i.y), r.directionalMaterial.opacity = r.directionalAlpha;
			let u = (i.y - this.settings.floorY) / this.settings.invisibleHeight, d = u < 0 ? 1 : 1 - Math.min(u, 1);
			r.crossAnchor.position.set(i.x, this.settings.floorY + yt, i.z), r.crossMaterial.opacity = this.settings.crossOpacity * d;
		}
	}
	getDebugSnapshot(e) {
		let t = this.pairs[0];
		t.directionalAnchor.updateMatrixWorld(!0), t.crossAnchor.updateMatrixWorld(!0);
		let n = new y.Vector3(0, 0, 1).applyQuaternion(t.directionalAnchor.getWorldQuaternion(new y.Quaternion())).normalize(), r = this.pairs.reduce((e, t) => e.add(t.targetWorldPosition), new y.Vector3()).multiplyScalar(1 / Math.max(this.pairs.length, 1));
		return {
			visible: this.group.visible,
			floorY: Number(this.settings.floorY.toFixed(4)),
			characterModelScale: Number(e.toFixed(4)),
			settings: { ...this.settings },
			targetPosition: F(r),
			targetPositions: this.pairs.map((e) => F(e.targetWorldPosition)),
			directional: {
				position: F(t.directionalAnchor.position),
				forward: F(n),
				scale: F(new y.Vector3(this.settings.width, 1, this.settings.height)),
				opacity: Number(t.directionalMaterial.opacity.toFixed(4)),
				alpha: Number(t.directionalAlpha.toFixed(4))
			},
			cross: {
				position: F(t.crossAnchor.position),
				scale: F(new y.Vector3(this.settings.crossSize, 1, this.settings.crossSize)),
				opacity: Number(t.crossMaterial.opacity.toFixed(4))
			},
			pairs: this.pairs.map((e) => ({
				targetPosition: F(e.targetWorldPosition),
				directionalOpacity: Number(e.directionalMaterial.opacity.toFixed(4)),
				crossOpacity: Number(e.crossMaterial.opacity.toFixed(4))
			}))
		};
	}
	dispose() {
		let e = /* @__PURE__ */ new Set();
		this.group.traverse((t) => {
			let n = t;
			if (!n.isMesh) return;
			n.geometry.dispose();
			let r = Array.isArray(n.material) ? n.material : [n.material];
			for (let t of r) {
				let n = t.map;
				n && e.add(n), t.dispose();
			}
		});
		for (let t of e) t.dispose();
	}
	createShadowMaterial(e, t) {
		return new y.MeshBasicMaterial({
			color: "#000000",
			map: e,
			transparent: !0,
			opacity: t,
			depthWrite: !1,
			depthTest: !0,
			polygonOffset: !0,
			polygonOffsetFactor: -1,
			side: y.DoubleSide
		});
	}
	calculateDirectionalAlpha(e, t) {
		if (!this.settings.adjustAlpha) return this.settings.opacity;
		let n = (t - (e.initialToeHeight ?? this.settings.floorY)) / this.settings.invisibleHeight, r = n < 0 ? 1 : 1 - Math.min(n, 1);
		return this.settings.opacity * r;
	}
	resolveDirection(e, t) {
		if (!t) return this.defaultDirection.clone();
		let n = new y.Vector3(e.x - t.x, 0, e.z - t.z);
		return n.lengthSq() < 1e-6 ? this.defaultDirection.clone() : n.normalize();
	}
};
function Ct(e = 128) {
	let t = document.createElement("canvas");
	t.width = e, t.height = e;
	let n = t.getContext("2d");
	if (!n) throw Error("Canvas 2D context is required for projected shadow texture.");
	let r = n.createRadialGradient(e * .5, e * .5, e * .05, e * .5, e * .5, e * .5);
	r.addColorStop(0, "rgba(0, 0, 0, 0.72)"), r.addColorStop(.45, "rgba(0, 0, 0, 0.32)"), r.addColorStop(1, "rgba(0, 0, 0, 0.0)"), n.fillStyle = r, n.fillRect(0, 0, e, e);
	let i = new y.CanvasTexture(t);
	return i.colorSpace = y.NoColorSpace, i.wrapS = y.ClampToEdgeWrapping, i.wrapT = y.ClampToEdgeWrapping, i.needsUpdate = !0, i;
}
function wt(e, t) {
	let n = (e, t, n = 0) => Number.isFinite(e) ? Math.max(e, n) : t, r = (e, t) => Number.isFinite(e) ? y.MathUtils.clamp(e, 0, 1) : t;
	return {
		width: n(e.width, t.width, .001),
		height: n(e.height, t.height, .001),
		opacity: r(e.opacity, t.opacity),
		crossSize: n(e.crossSize, t.crossSize, .001),
		crossOpacity: r(e.crossOpacity, t.crossOpacity),
		floorY: Number.isFinite(e.floorY) ? e.floorY : t.floorY,
		adjustShadow: e.adjustShadow ?? t.adjustShadow,
		adjustAlpha: e.adjustAlpha ?? t.adjustAlpha,
		invisibleHeight: n(e.invisibleHeight, t.invisibleHeight, .001),
		directionalShadow: e.directionalShadow ?? t.directionalShadow
	};
}
function F(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5))
	};
}
//#endregion
//#region src/costume_shop/heightPolicy.ts
var Tt = 1.6;
function Et(e) {
	return .5 + .8 / Ot(e);
}
function Dt(e) {
	return Et(e);
}
function Ot(e) {
	return y.MathUtils.clamp(e || Tt, .5, 2);
}
//#endregion
//#region src/engine/faceMotionRuntime.ts
function kt(e) {
	return e && typeof e == "object" ? e : {};
}
function At(e) {
	let t = e;
	return !!t.isMesh && Array.isArray(t.morphTargetInfluences);
}
function jt(e, t) {
	if (!e.length) return 0;
	if (t <= e[0].time) return e[0].value;
	for (let n = 1; n < e.length; n += 1) {
		let r = e[n - 1], i = e[n];
		if (t > i.time) continue;
		let a = i.time - r.time;
		if (a <= 1e-6) return i.value;
		let o = (t - r.time) / a;
		return r.value + (i.value - r.value) * o;
	}
	return e[e.length - 1].value;
}
function Mt(e) {
	let t = kt(kt(e).motionPackage ?? kt(e).MotionPackage);
	return (t.faceMotion ?? t.FaceMotion) || null;
}
var Nt = class {
	motionSet = null;
	clip = null;
	loopClip = null;
	time = 0;
	error = null;
	enabled = !0;
	bindings = [];
	bind(e, t) {
		let n = t.morphChannels ?? [], r = t.morphChannelBindings ?? [], i = [];
		return this.bindings.length = 0, e.traverse((e) => {
			if (e.userData.pjskEyeThroughHairOverlay || e.userData.pjskEyeThroughHairStencilPrepass || !At(e)) return;
			let t = e, a = t.morphTargetInfluences?.length ?? 0;
			if (!a) return;
			(!t.morphTargetDictionary || !Object.keys(t.morphTargetDictionary).length) && n.length === a && (t.morphTargetDictionary = Object.fromEntries(n.map((e, t) => [e, t])));
			let o = t.morphTargetDictionary ?? {}, s = /* @__PURE__ */ new Map(), c = [];
			for (let e of r) {
				let t = o[e.name];
				typeof t == "number" && (s.set(e.curveHash, t), c.push(t));
			}
			t.morphTargetInfluences?.fill(0), this.bindings.push({
				mesh: t,
				curveIndexByHash: s,
				controlledIndices: [...new Set(c)]
			});
			let l = Object.entries(o).sort((e, t) => e[1] - t[1]).map(([e]) => e);
			i.push({
				meshName: t.name,
				morphTargetCount: a,
				mappedChannelCount: s.size,
				sampleChannels: l.slice(0, 12)
			});
		}), i;
	}
	setMotion(e, t, n) {
		if (this.motionSet = e, this.error = null, this.time = 0, this.clip = null, this.loopClip = null, !e?.clips.length) {
			this.clearInfluences();
			return;
		}
		this.clip = e.clips.find((e) => e.name === t) ?? e.clips[0] ?? null, this.clip && (n && n !== this.clip.name && (this.loopClip = e.clips.find((e) => e.name === n) ?? null), this.applyCurrent());
	}
	hasMotion() {
		return this.motionSet !== null;
	}
	isEnabled() {
		return this.enabled;
	}
	setEnabled(e) {
		this.enabled = e, e ? this.applyCurrent() : this.clearInfluences();
	}
	step(e, t, n = !1) {
		if (n || !this.enabled || !this.clip || this.bindings.length === 0) return;
		this.time += e * t;
		let r = this.clip.duration;
		if (r > 0 && this.time > r) if (this.loopClip) {
			let e = this.time - r;
			this.clip = this.loopClip, this.loopClip = null, this.time = this.clip.duration > 0 ? e % this.clip.duration : 0;
		} else this.time %= r;
		this.applyCurrent();
	}
	seek(e) {
		this.time = e, this.applyCurrent();
	}
	promoteLoop() {
		this.loopClip && (this.clip = this.loopClip, this.loopClip = null, this.time = 0, this.applyCurrent());
	}
	applyCurrent() {
		if (!(!this.enabled || !this.clip)) for (let e of this.bindings) {
			let t = e.mesh.morphTargetInfluences;
			if (t) {
				for (let n of e.controlledIndices) t[n] = 0;
				for (let n of this.clip.curves) {
					let r = e.curveIndexByHash.get(n.curveHash);
					r !== void 0 && (t[r] = jt(n.keyframes, this.time) / 100);
				}
			}
		}
	}
	release(e = {}) {
		this.clearInfluences(), this.bindings.length = 0, e.preserveMotion || this.setMotion(null, null, null);
	}
	getSnapshot() {
		return {
			activeClipName: this.clip?.name ?? null,
			queuedLoopClipName: this.loopClip?.name ?? null,
			error: this.error,
			currentTime: this.time,
			mappedMeshCount: this.bindings.length,
			mappedCurveCount: this.bindings.reduce((e, t) => e + t.curveIndexByHash.size, 0)
		};
	}
	clearInfluences() {
		for (let e of this.bindings) {
			let t = e.mesh.morphTargetInfluences;
			if (t) for (let n of e.controlledIndices) t[n] = 0;
		}
	}
};
//#endregion
//#region src/engine/rawMaterialRuntime.ts
function I(e, t) {
	return e.toLowerCase() === t.toLowerCase();
}
function L(e, t) {
	let n = e?.floatProperties?.find((e) => I(e.name, t));
	if (Number.isFinite(n?.value)) return n.value;
	let r = e?.intProperties?.find((e) => I(e.name, t));
	return Number.isFinite(r?.value) ? r.value : null;
}
function Pt(e, t, n) {
	let r = L(e, t);
	return r === null ? n && (e?.validKeywords?.some((e) => I(e, n)) || e?.invalidKeywords?.some((e) => I(e, n))) ? !0 : null : r > .5;
}
function R(e, t) {
	let n = e?.colorProperties?.find((e) => I(e.name, t));
	return !n || !Number.isFinite(n.r) || !Number.isFinite(n.g) || !Number.isFinite(n.b) || !Number.isFinite(n.a) ? null : {
		r: n.r,
		g: n.g,
		b: n.b,
		a: n.a
	};
}
function Ft(e, t) {
	return e?.textureProperties?.find((e) => I(e.name, t)) ?? null;
}
function z(e, t, n) {
	if (!e) return;
	let r = Ft(t, n);
	r && (e.repeat.set(r.scaleX, r.scaleY), e.offset.set(r.offsetX, r.offsetY), e.wrapS = It(r.wrapU), e.wrapT = It(r.wrapV), e.anisotropy = Math.max(1, r.anisoLevel || 1), r.filterMode === 0 ? (e.magFilter = y.NearestFilter, e.minFilter = y.NearestMipmapNearestFilter) : (e.magFilter = y.LinearFilter, e.minFilter = r.filterMode === 2 ? y.LinearMipmapLinearFilter : y.LinearMipmapNearestFilter)), e.updateMatrix(), e.needsUpdate = !0;
}
function It(e) {
	switch (e) {
		case 1: return y.ClampToEdgeWrapping;
		case 2: return y.MirroredRepeatWrapping;
		case 3: return y.ClampToEdgeWrapping;
		default: return y.RepeatWrapping;
	}
}
//#endregion
//#region src/engine/characterMaterialRuntime.ts
var Lt = {
	eye: {
		opacity: .2,
		edge1: .9,
		edge2: .2
	},
	eyelash: {
		opacity: .2,
		edge1: .9,
		edge2: .2
	},
	eyebrow: {
		opacity: .5,
		edge1: .5,
		edge2: .1
	},
	eyelight: {
		opacity: .2,
		edge1: .9,
		edge2: .2
	}
};
function B() {
	return new y.Vector3(T.x, T.y, T.z);
}
function Rt(e, t) {
	let n = e.clone();
	return Re(n, {
		baseColor: t.baseColor ?? e.uniforms.uBaseColor.value.clone(),
		shadowColor: t.shadowColor ?? e.uniforms.uShadowColor.value.clone(),
		skinColorDefault: t.skinColorDefault ?? e.uniforms.uSkinColorDefault.value.clone(),
		skinColor1: t.skinColor1 ?? e.uniforms.uSkinColor1.value.clone(),
		skinColor2: t.skinColor2 ?? e.uniforms.uSkinColor2.value.clone(),
		mainTex: t.mainTex ?? null,
		shadowTex: t.shadowTex ?? null,
		valueTex: t.valueTex ?? null,
		useValueTex: t.lighting?.useValueTex ?? !!t.valueTex,
		lightDirection: e.uniforms.uLightDirection.value.clone(),
		lightIntensity: e.uniforms.uLightIntensity.value,
		ambientIntensity: e.uniforms.uAmbientIntensity.value,
		shadowThreshold: t.lighting?.sekaiShadowThreshold ?? e.uniforms.uShadowThreshold.value,
		shadowWeight: e.uniforms.uShadowWeight.value,
		characterAmbientIntensity: e.uniforms.uCharacterAmbientIntensity?.value ?? .3,
		rimColorAlpha: e.uniforms.uRimColorAlpha?.value ?? E.rimColorAlpha,
		controllerRimRange: e.uniforms.uControllerRimRange?.value ?? E.rimRange,
		controllerRimEdgeSmoothness: e.uniforms.uControllerRimEdgeSmoothness?.value ?? E.rimEdgeSmoothness,
		controllerRimEmission: e.uniforms.uControllerRimEmission?.value ?? E.rimEmission,
		controllerRimLightInfluence: e.uniforms.uControllerRimLightInfluence?.value ?? E.rimLightInfluence,
		rimDirection: e.uniforms.uRimDirection?.value.clone() ?? B(),
		specularPower: t.lighting?.specularPower ?? e.uniforms.uSpecularPower.value,
		rimThreshold: t.lighting?.rimThreshold ?? e.uniforms.uRimThreshold.value,
		shadowTexWeight: t.lighting?.shadowTexWeight ?? e.uniforms.uShadowTexWeight.value,
		fadeMode: t.lighting?.fadeMode ?? e.uniforms.uFadeMode?.value ?? 0,
		hueSinAngle: t.lighting?.hueSinAngle ?? e.uniforms.uHueSinAngle?.value ?? 0,
		hueCosAngle: t.lighting?.hueCosAngle ?? e.uniforms.uHueCosAngle?.value ?? 1,
		shadowWidth: t.lighting?.shadowWidth ?? e.uniforms.uShadowWidth.value,
		shadowWidthOverride: t.shadowWidthOverride ?? ((e.uniforms.uShadowWidthOverride?.value ?? -1) >= 0 ? e.uniforms.uShadowWidthOverride.value : null),
		valueShadowInfluence: t.valueShadowInfluence ?? e.uniforms.uValueShadowInfluence?.value ?? 0,
		hairShadowEnabled: t.hairShadowEnabled ?? (e.uniforms.uHairShadowEnabled?.value ?? 0) > .5,
		useLambert: t.useLambert ?? t.lighting?.useLambert ?? (e.uniforms.uUseLambert?.value ?? 1) > .5,
		headPosition: t.headPosition ?? e.uniforms.uHeadPosition?.value.clone(),
		headNormalBlend: t.lighting?.headNormalBlend ?? e.uniforms.uHeadNormalBlend?.value ?? .7,
		saturation: t.lighting?.saturation ?? e.uniforms.uSaturation.value,
		value: t.lighting?.value ?? e.uniforms.uValue?.value ?? .5,
		contrast: t.lighting?.contrast ?? e.uniforms.uContrast?.value ?? .5,
		partsAmbientColor: t.lighting?.partsAmbientColor ?? e.uniforms.uPartsAmbientColor.value.clone(),
		partsAmbientAlpha: e.uniforms.uPartsAmbientAlpha?.value ?? 0,
		reflectionBlendColor: t.lighting?.reflectionBlendColor ?? e.uniforms.uReflectionBlendColor.value.clone(),
		globalShadowColor: e.uniforms.uGlobalShadowColor ? e.uniforms.uGlobalShadowColor.value.clone() : "#ffffff",
		globalShadowAlpha: e.uniforms.uGlobalShadowAlpha?.value ?? 1,
		controllerAmbientColor: e.uniforms.uControllerAmbientColor ? e.uniforms.uControllerAmbientColor.value.clone() : new y.Color().setRGB(E.ambientColor.r, E.ambientColor.g, E.ambientColor.b),
		controllerAmbientIntensity: e.uniforms.uControllerAmbientIntensity?.value ?? 1,
		controllerSpecularColor: e.uniforms.uControllerSpecularColor ? e.uniforms.uControllerSpecularColor.value.clone() : "#ffffff",
		controllerSpecularIntensity: e.uniforms.uControllerSpecularIntensity?.value ?? 1,
		controllerRimColor: e.uniforms.uControllerRimColor ? e.uniforms.uControllerRimColor.value.clone() : new y.Color().setRGB(E.rimColor.r, E.rimColor.g, E.rimColor.b),
		controllerShadowRimColor: e.uniforms.uControllerShadowRimColor ? e.uniforms.uControllerShadowRimColor.value.clone() : new y.Color().setRGB(E.shadowRimColor.r, E.shadowRimColor.g, E.shadowRimColor.b),
		controllerRimColorWeight: e.uniforms.uControllerRimColorWeight?.value ?? 1,
		controllerShadowRimColorWeight: e.uniforms.uControllerShadowRimColorWeight?.value ?? 1,
		controllerRimShadowSharpness: e.uniforms.uControllerRimShadowSharpness?.value ?? E.rimShadowSharpness,
		bodyDebugMode: t.bodyDebugMode ?? e.uniforms.uBodyDebugMode?.value ?? 0,
		alphaCutoff: t.alphaCutoff ?? e.uniforms.uAlphaCutoff?.value ?? 0
	}), n;
}
async function V(e, t, n = y.SRGBColorSpace) {
	if (!t) return null;
	let r = `${n}\u0000${t}`, i = zt.get(e);
	i || (i = /* @__PURE__ */ new Map(), zt.set(e, i));
	let a = i.get(r);
	if (a) return a;
	let o = e.loadAsync(t).then((e) => (e.wrapS = y.RepeatWrapping, e.wrapT = y.RepeatWrapping, e.flipY = !1, e.colorSpace = n, e.needsUpdate = !0, e), () => null).finally(() => {
		i.get(r) === o && i.delete(r);
	});
	return i.set(r, o), o;
}
var zt = /* @__PURE__ */ new WeakMap();
function Bt(e) {
	return e.map ?? null;
}
function Vt(e, t) {
	if (!t) return;
	let n = (e) => {
		e && (e.wrapS = t.wrapS, e.wrapT = t.wrapT, e.offset.copy(t.offset), e.repeat.copy(t.repeat), e.center.copy(t.center), e.rotation = t.rotation, e.magFilter = t.magFilter, e.minFilter = t.minFilter, e.anisotropy = t.anisotropy, e.flipY = t.flipY, e.updateMatrix(), e.needsUpdate = !0);
	};
	if (e instanceof y.MeshBasicMaterial) n(e.map);
	else if (e instanceof y.ShaderMaterial) {
		let t = e.uniforms.uMainTex?.value;
		n(t), t && e.uniforms.uMainTexTransform?.value instanceof y.Matrix3 && e.uniforms.uMainTexTransform.value.copy(t.matrix);
	}
}
function Ht(e) {
	let t = e.toLowerCase();
	return t.includes("face") ? "face" : t.includes("hair") ? "hair" : t.includes("acc") ? "acc" : t.includes("body") ? "body" : t;
}
function Ut(e, t, n) {
	if (!t) return;
	let r = (e, t) => L(n, e) ?? t, i = (e, t, r) => Pt(n, e, t) ?? r, a = (e) => Math.round(y.MathUtils.clamp(e, 0, 1) * 255).toString(16).padStart(2, "0"), o = (e, t) => {
		let r = R(n, e);
		return r ? `#${a(r.r)}${a(r.g)}${a(r.b)}` : t;
	};
	return {
		...t,
		specularPower: r("_SpecularPower", t.specularPower),
		rimThreshold: r("_RimThreshold", t.rimThreshold),
		shadowTexWeight: r("_ShadowTexWeight", t.shadowTexWeight),
		fadeMode: r("_FadeMode", t.fadeMode),
		hueSinAngle: r("_HueSinAngle", t.hueSinAngle),
		hueCosAngle: r("_HueCosAngle", t.hueCosAngle),
		saturation: r("_Saturation", t.saturation),
		value: r("_Value", t.value),
		contrast: r("_Contrast", t.contrast),
		partsAmbientColor: o("_PartsAmbientColor", t.partsAmbientColor),
		reflectionBlendColor: o("_ReflectionBlendColor", t.reflectionBlendColor),
		outlineWidth: r("_OutlineWidth", t.outlineWidth),
		outlineOffset: r("_OutlineOffset", t.outlineOffset),
		outlineLightness: r("_OutlineL", t.outlineLightness),
		shadowWidth: r("_ShadowWidth", t.shadowWidth),
		useOutlineSecondNormal: L(n, "_UseOutlineSecondNormal") ?? (Pt(n, "_UseOutlineSecondNormal", "_OUTLINE_SECOND_NORMAL") === !0 ? 1 : t.useOutlineSecondNormal),
		sekaiShadowThreshold: L(n, "_SekaiShadowThreshold") ?? t.sekaiShadowThreshold,
		useLambert: i("_UseLambert", "_LAMBERT", t.useLambert),
		useValueTex: i("_UseValueTex", void 0, t.useValueTex),
		useFaceSdf: i("_UseFaceSDF", "_USE_FACE_SDF", t.useFaceSdf),
		useFaceShadowLimiter: i("_UseFaceShadowLimiter", "_FACE_SHADOW_RANGE_LIMIT", t.useFaceShadowLimiter),
		rangeLimit: L(n, "_RangeLimit") ?? t.rangeLimit,
		hairShadow: i("_HairShadow", "_HAIR_SHADOW", t.hairShadow),
		headNormalBlend: r("_HeadNormalBlend", t.headNormalBlend ?? .7)
	};
}
function Wt(e, t) {
	if (!(e instanceof y.ShaderMaterial) || !t) return;
	let n = e.uniforms, r = (e, r) => {
		let i = L(t, r);
		i !== null && n[e] && (n[e].value = i);
	}, i = (e, r, i) => {
		let a = R(t, r);
		a && (n[e]?.value?.setRGB(a.r, a.g, a.b), i && n[i] && (n[i].value = a.a));
	};
	i("uPartsAmbientColor", "_PartsAmbientColor", "uPartsAmbientAlpha"), i("uReflectionBlendColor", "_ReflectionBlendColor"), i("uSkinColorDefault", "_DefaultSkinColor"), i("uSkinColor1", "_Shadow1SkinColor"), i("uSkinColor2", "_Shadow2SkinColor"), r("uUseLambert", "_UseLambert"), r("uUseValueTex", "_UseValueTex"), r("uHeadNormalBlend", "_HeadNormalBlend");
	let a = Pt(t, "_UseAlphaClip", "_ALPHATEST_ON");
	a !== null && n.uAlphaCutoff && (n.uAlphaCutoff.value = a ? y.MathUtils.clamp(L(t, "_Cutoff") ?? .5, 0, 1) : 0);
}
function Gt(e) {
	e.stencilWrite = !0, e.stencilRef = 0, e.stencilFunc = y.AlwaysStencilFunc, e.stencilFuncMask = 255, e.stencilWriteMask = 255, e.stencilFail = y.KeepStencilOp, e.stencilZFail = y.KeepStencilOp, e.stencilZPass = y.ReplaceStencilOp;
}
function Kt(e, t, n, r) {
	if (e.side = y.FrontSide, e.transparent = !0, e.stencilWrite = !0, e.stencilRef = t, e.stencilFunc = y.EqualStencilFunc, e.stencilFuncMask = t, e.stencilWriteMask = t, e.stencilFail = y.KeepStencilOp, e.stencilZFail = y.KeepStencilOp, e.stencilZPass = y.KeepStencilOp, e.depthTest = !0, e.depthWrite = !1, e.depthFunc = y.AlwaysDepth, e.blending = y.CustomBlending, e.blendSrc = y.SrcAlphaFactor, e.blendDst = y.OneMinusSrcAlphaFactor, e.blendEquation = y.AddEquation, e.blendSrcAlpha = y.ZeroFactor, e.blendDstAlpha = y.OneFactor, e.blendEquationAlpha = y.AddEquation, e.polygonOffset = !1, n) {
		let t = Lt[n], i = (e, t) => L(r, e) ?? R(r, e)?.r ?? t, a = {
			opacity: i("_EyelashTransparent", t.opacity),
			edge1: i("_EyelashFaceCameraEdge1", t.edge1),
			edge2: i("_EyelashFaceCameraEdge2", t.edge2)
		};
		e.userData.pjskSekaiEyelashViewSettings = { ...a }, e instanceof y.ShaderMaterial && e.uniforms.uAlphaScale && (e.uniforms.uAlphaScale.value = a.opacity), e instanceof y.ShaderMaterial && e.uniforms.uAlphaSource && (e.uniforms.uAlphaSource.value = n === "eyelight" ? 2 : 1);
	}
}
function qt(e, t) {
	let n = e.userData.pjskSekaiEyelashViewSettings;
	if (!n) return null;
	let r = n.edge1 - n.edge2, i = r === 0 ? +(t >= n.edge1) : y.MathUtils.clamp((t - n.edge2) / r, 0, 1), a = i * i * (3 - 2 * i) * n.opacity;
	return e instanceof y.ShaderMaterial && e.uniforms.uAlphaScale && (e.uniforms.uAlphaScale.value = a), a;
}
function Jt(e, t) {
	e.transparent = !1, e.colorWrite = !1, e.stencilWrite = !0, e.stencilRef = t, e.stencilFunc = y.AlwaysStencilFunc, e.stencilFuncMask = 255, e.stencilWriteMask = t, e.stencilFail = y.KeepStencilOp, e.stencilZFail = y.KeepStencilOp, e.stencilZPass = y.ReplaceStencilOp, e.depthTest = !0, e.depthWrite = !1, e.depthFunc = y.LessEqualDepth;
}
function Yt(e, t) {
	e.stencilWrite = !0, e.stencilRef = 0, e.stencilFunc = y.AlwaysStencilFunc, e.stencilFuncMask = 255, e.stencilWriteMask = 255 & ~t, e.stencilFail = y.KeepStencilOp, e.stencilZFail = y.KeepStencilOp, e.stencilZPass = y.ReplaceStencilOp;
}
function Xt(e) {
	switch (e) {
		case "face_sdf":
		case "face":
		case "accessory":
		case "body":
		case "eyelight": return 2e3;
		case "eye_stencil_prepass": return 2001;
		case "eyelash_stencil_prepass": return 2001.1;
		case "eyebrow_stencil_prepass": return 2001.2;
		case "eyelash":
		case "eyebrow": return 2001;
		case "eye": return 2002;
		case "hair": return 2451;
		case "eye_through_hair": return 2452;
		case "eyelash_through_hair": return 2453;
		case "eyebrow_through_hair": return 2454;
		case "eyelight_through_hair": return 2455;
		default: return 2e3;
	}
}
function Zt(e, t) {
	if (t.length < 2 || e.geometry.groups.length < 2) return;
	let n = e.geometry.groups.map((e, n) => {
		let r = t[e.materialIndex ?? 0], i = typeof r?.userData.pjskMaterialKind == "string" ? r.userData.pjskMaterialKind : "";
		return {
			start: e.start,
			count: e.count,
			materialIndex: e.materialIndex ?? 0,
			order: Xt(i),
			index: n
		};
	}).sort((e, t) => e.order - t.order || e.index - t.index);
	e.geometry.clearGroups();
	for (let t of n) e.geometry.addGroup(t.start, t.count, t.materialIndex);
}
function Qt(e, t, n, r) {
	if (t.length === 0 || n.length === 0) return null;
	let i = e.geometry.clone();
	i.clearGroups();
	for (let e of t) i.addGroup(e.start, e.count, e.materialIndex);
	let a = e, o = a.isSkinnedMesh ? new y.SkinnedMesh(i, n) : new y.Mesh(i, n);
	if (o.name = `${e.name}_${r}`, o.position.copy(e.position), o.quaternion.copy(e.quaternion), o.scale.copy(e.scale), o.matrix.copy(e.matrix), o.matrixAutoUpdate = e.matrixAutoUpdate, o.matrixWorldAutoUpdate = e.matrixWorldAutoUpdate, o.layers.mask = e.layers.mask, o.visible = e.visible, o.renderOrder = Math.min(...n.map((e) => Xt(typeof e.userData.pjskMaterialKind == "string" ? e.userData.pjskMaterialKind : ""))), o.frustumCulled = e.frustumCulled, o.castShadow = !1, o.receiveShadow = !1, o.morphTargetDictionary = e.morphTargetDictionary, o.morphTargetInfluences = e.morphTargetInfluences, Zt(o, n), o.isSkinnedMesh && a.isSkinnedMesh) {
		let e = o;
		e.bind(a.skeleton, a.bindMatrix), e.bindMode = a.bindMode, e.bindMatrix.copy(a.bindMatrix), e.bindMatrixInverse.copy(a.bindMatrixInverse);
	}
	return o;
}
function $t(e, t, n) {
	let r = Qt(e, t, n, "through_hair_overlay");
	if (!r) return null;
	let i = typeof n[0]?.userData.pjskMaterialKind == "string" ? n[0].userData.pjskMaterialKind : "", a = i.startsWith("eyelash_") ? "eyelash" : i.startsWith("eyebrow_") ? "eyebrow" : i.startsWith("eyelight_") ? "eyelight" : i.startsWith("eye_") ? "eye" : "";
	return r.userData.pjskEyeThroughHairSource = e, r.userData.pjskEyeThroughHairSourceKind = a, r.userData.pjskEyeThroughHairPassKind = "overlay", r.userData.pjskEyeThroughHairOverlay = !0, r;
}
async function en({ root: e, bodyAsset: t, headAsset: n, textureLoader: r, template: i, bodyDebugMode: a, debug: o = [] }) {
	let s = await Promise.all(t.bodyMaterials.map(async (e) => {
		if (!e.materialKind) throw Error(`Body material ${e.materialName ?? e.materialKey} is missing materialKind.`);
		let [o, s, c] = await Promise.all([
			V(r, e.mainTex),
			V(r, e.shadowTex),
			V(r, e.valueTex, y.NoColorSpace)
		]);
		z(o, e.rawMaterial, "_MainTex"), z(s, e.rawMaterial, "_ShadowTex"), z(c, e.rawMaterial, "_ValueTex");
		let l = Ut(e.materialKind, e.lighting, e.rawMaterial), u = Rt(i, {
			mainTex: o,
			shadowTex: s,
			valueTex: c,
			baseColor: t.proxy.bodyColor,
			shadowColor: t.proxy.shadowColor,
			skinColorDefault: n?.proxy.skinColorDefault ?? n?.proxy.faceColor ?? t.proxy.bodyColor,
			skinColor1: n?.proxy.skinColor1 ?? n?.proxy.faceShadeColor ?? t.proxy.shadowColor,
			skinColor2: n?.proxy.skinColor2 ?? n?.proxy.faceShadeColor ?? t.proxy.shadowColor,
			lighting: l,
			bodyDebugMode: a
		});
		return Wt(u, e.rawMaterial), Gt(u), u.userData.pjskLighting = l, u.userData.pjskRawMaterial = e.rawMaterial, u.userData.pjskMaterialKind = e.materialKind, u.userData.pjskMaterialKey = e.materialKey, u.userData.pjskMaterialSlotIndex = e.slotIndex, {
			key: e.materialKey,
			meshKey: Ht(e.meshName),
			materialKey: e.materialKey,
			materialKind: e.materialKind,
			mainTex: e.mainTex ?? null,
			shadowTex: e.shadowTex ?? null,
			valueTex: e.valueTex ?? null,
			material: u
		};
	}));
	return e.traverse((e) => {
		let t = e;
		if (!t.isMesh) return;
		let n = Array.isArray(t.material) ? t.material : [t.material], r = s.filter((e) => e.meshKey === Ht(t.name));
		if (r.length === 0) return;
		let i = n.map((e) => {
			let n = typeof e.userData.pjskMaterialKey == "string" ? e.userData.pjskMaterialKey : "";
			if (!n) throw Error(`Body mesh '${t.name}' material '${e.name}' is missing pjskMaterialKey; regenerate it with Haruki-3D-Exporter materialKey runtime support.`);
			let i = r.find((e) => e.materialKey === n);
			if (!i) throw Error(`Body mesh '${t.name}' material key '${n}' was not found in body material slots.`);
			let a = Bt(e);
			Vt(i.material, a), t.userData.pjskMaterialKind = i.materialKind;
			let s = !1;
			!i.material.uniforms.uMainTex.value && a && (i.material.uniforms.uMainTex.value = a, i.material.uniforms.uMainTexTransform.value.copy(a.matrix), i.material.uniforms.uUseMainTex.value = 1, i.material.uniforms.uBaseColor.value.set("#ffffff"), s = !0);
			let c = i.material.uniforms;
			return o.push({
				meshName: t.name,
				sourceMaterialName: e.name,
				resolvedKey: i.key,
				resolvedKind: i.materialKind,
				usedOriginalMap: s,
				boundMainTex: i.mainTex,
				boundShadowTex: i.shadowTex,
				boundValueTex: i.valueTex,
				boundFaceShadowTex: null,
				finalMaterialType: i.material.type,
				shaderHasMainTex: c.uUseMainTex?.value ?? null,
				shaderHasShadowTex: c.uUseShadowTex?.value ?? null,
				shaderHasValueTex: c.uUseValueTex?.value ?? null,
				shaderLightDirectionX: c.uLightDirection?.value?.x ?? null,
				shaderLightDirectionY: c.uLightDirection?.value?.y ?? null,
				shaderLightDirectionZ: c.uLightDirection?.value?.z ?? null,
				shaderShadowThreshold: c.uShadowThreshold?.value ?? null,
				shaderShadowWeight: c.uShadowWeight?.value ?? null,
				shaderShadowWidthOverride: c.uShadowWidthOverride?.value ?? null,
				shaderValueShadowInfluence: c.uValueShadowInfluence?.value ?? null,
				shaderLambertEnabled: c.uUseLambert?.value ?? null,
				shaderHeadNormalBlend: c.uHeadNormalBlend?.value ?? null,
				shaderSpecularPower: c.uSpecularPower?.value ?? null,
				shaderRimThreshold: c.uRimThreshold?.value ?? null,
				shaderControllerRimRange: c.uControllerRimRange?.value ?? null,
				shaderControllerRimEdgeSmoothness: c.uControllerRimEdgeSmoothness?.value ?? null,
				shaderRimColorAlpha: c.uRimColorAlpha?.value ?? null,
				shaderControllerRimEmission: c.uControllerRimEmission?.value ?? null,
				shaderControllerRimLightInfluence: c.uControllerRimLightInfluence?.value ?? null,
				shaderCharacterAmbient: c.uCharacterAmbientIntensity?.value ?? null,
				shaderShadowTexWeight: c.uShadowTexWeight?.value ?? null,
				shaderSaturation: c.uSaturation?.value ?? null,
				shaderPartsAmbientAlpha: c.uPartsAmbientAlpha?.value ?? null,
				shaderSkinColorDefault: c.uSkinColorDefault?.value ? `#${c.uSkinColorDefault.value.getHexString(y.LinearSRGBColorSpace)}` : null,
				shaderSkinColor1: c.uSkinColor1?.value ? `#${c.uSkinColor1.value.getHexString(y.LinearSRGBColorSpace)}` : null,
				shaderSkinColor2: c.uSkinColor2?.value ? `#${c.uSkinColor2.value.getHexString(y.LinearSRGBColorSpace)}` : null,
				shaderBodyDebugMode: c.uBodyDebugMode?.value ?? null
			}), i.material;
		}), a = new Set(i);
		n.forEach((e) => {
			a.has(e) || e.dispose();
		}), t.material = Array.isArray(t.material) ? i : i[0], t.castShadow = !1, t.receiveShadow = !1;
	}), o;
}
//#endregion
//#region src/engine/headMaterialRuntime.ts
var H = 1, tn = .02, nn = .02;
function rn(e, t, n, r, i, a, o) {
	let s = r.material instanceof y.ShaderMaterial ? r.material.uniforms : null;
	e.push({
		meshName: t.name,
		sourceMaterialName: n.name,
		resolvedKey: r.key,
		resolvedKind: r.materialKind,
		usedOriginalMap: i,
		boundMainTex: r.mainTex,
		boundShadowTex: r.shadowTex,
		boundValueTex: r.valueTex,
		boundFaceShadowTex: r.faceShadowTex,
		finalMaterialType: r.material.type,
		shaderHasMainTex: s?.uUseMainTex?.value ?? null,
		shaderHasShadowTex: s?.uUseShadowTex?.value ?? null,
		shaderHasFaceShadowTex: s?.uUseFaceShadowTex?.value ?? null,
		shaderHasValueTex: s?.uUseValueTex?.value ?? null,
		shaderLightDirectionX: s?.uLightDirection?.value?.x ?? null,
		shaderLightDirectionY: s?.uLightDirection?.value?.y ?? null,
		shaderLightDirectionZ: s?.uLightDirection?.value?.z ?? null,
		shaderShadowThreshold: s?.uShadowThreshold?.value ?? null,
		shaderShadowWeight: s?.uShadowWeight?.value ?? null,
		shaderShadowWidthOverride: s?.uShadowWidthOverride?.value ?? null,
		shaderValueShadowInfluence: s?.uValueShadowInfluence?.value ?? null,
		shaderHairShadowEnabled: r.materialKind === "hair" ? s?.uHairShadowEnabled?.value ?? null : null,
		shaderHeadNormalBlend: r.materialKind === "hair" ? s?.uHeadNormalBlend?.value ?? null : null,
		shaderLambertEnabled: s?.uUseLambert?.value ?? null,
		shaderBodyDebugMode: s?.uBodyDebugMode?.value ?? null,
		shaderSpecularPower: s?.uSpecularPower?.value ?? null,
		shaderRimThreshold: s?.uRimThreshold?.value ?? null,
		shaderControllerRimRange: s?.uControllerRimRange?.value ?? null,
		shaderControllerRimEdgeSmoothness: s?.uControllerRimEdgeSmoothness?.value ?? null,
		shaderRimColorAlpha: s?.uRimColorAlpha?.value ?? null,
		shaderControllerRimEmission: s?.uControllerRimEmission?.value ?? null,
		shaderControllerRimLightInfluence: s?.uControllerRimLightInfluence?.value ?? null,
		shaderCharacterAmbient: s?.uCharacterAmbientIntensity?.value ?? null,
		shaderShadowTexWeight: s?.uShadowTexWeight?.value ?? null,
		shaderSaturation: s?.uSaturation?.value ?? null,
		shaderPartsAmbientAlpha: s?.uPartsAmbientAlpha?.value ?? null,
		shaderSkinColorDefault: s?.uSkinColorDefault?.value ? `#${s.uSkinColorDefault.value.getHexString(y.LinearSRGBColorSpace)}` : null,
		shaderSkinColor1: s?.uSkinColor1?.value ? `#${s.uSkinColor1.value.getHexString(y.LinearSRGBColorSpace)}` : null,
		shaderSkinColor2: s?.uSkinColor2?.value ? `#${s.uSkinColor2.value.getHexString(y.LinearSRGBColorSpace)}` : null,
		shaderFaceDebugMode: s?.uFaceDebugMode?.value ?? null,
		shaderFaceSdfEnabled: s?.uFaceSdfEnabled?.value ?? null,
		faceSdfCapable: a,
		faceSdfUv1Available: o,
		shaderAtlasTileX: s?.uAtlasTile?.value?.x ?? null,
		shaderAtlasTileY: s?.uAtlasTile?.value?.y ?? null,
		shaderAtlasSample: s?.uAtlasSample?.value ?? null,
		shaderUseAtlas: s?.uUseAtlas?.value ?? null,
		shaderAlphaScale: s?.uAlphaScale?.value ?? null,
		shaderAlphaCutoff: s?.uAlphaCutoff?.value ?? null,
		shaderStrictAlpha: s?.uStrictAlpha?.value ?? null,
		shaderStencilWrite: r.material.stencilWrite ?? null,
		shaderStencilRef: r.material.stencilRef ?? null,
		shaderStencilFunc: r.material.stencilFunc ?? null,
		shaderStencilFuncMask: r.material.stencilFuncMask ?? null,
		shaderStencilWriteMask: r.material.stencilWriteMask ?? null,
		shaderStencilZPass: r.material.stencilZPass ?? null,
		shaderDepthFunc: r.material.depthFunc ?? null,
		shaderDepthWrite: r.material.depthWrite ?? null,
		shaderTransparent: r.material.transparent ?? null,
		renderOrder: t.renderOrder
	});
}
function an(e, t, n, r, i = !0) {
	let a = r instanceof y.ShaderMaterial ? r.uniforms : null;
	e.push({
		meshName: t,
		sourceMaterialName: n,
		resolvedKey: null,
		resolvedKind: typeof r.userData.pjskMaterialKind == "string" ? r.userData.pjskMaterialKind : null,
		usedOriginalMap: !1,
		boundMainTex: null,
		boundShadowTex: null,
		boundValueTex: null,
		boundFaceShadowTex: null,
		finalMaterialType: r.type,
		shaderHasMainTex: a?.uUseMainTex?.value ?? null,
		...i ? {
			shaderAtlasTileX: a?.uAtlasTile?.value?.x ?? null,
			shaderAtlasTileY: a?.uAtlasTile?.value?.y ?? null,
			shaderAtlasSample: a?.uAtlasSample?.value ?? null
		} : {},
		shaderUseAtlas: a?.uUseAtlas?.value ?? null,
		shaderAlphaScale: a?.uAlphaScale?.value ?? null,
		shaderAlphaCutoff: a?.uAlphaCutoff?.value ?? null,
		shaderStrictAlpha: a?.uStrictAlpha?.value ?? null,
		shaderStencilWrite: r.stencilWrite ?? null,
		shaderStencilRef: r.stencilRef ?? null,
		shaderStencilFunc: r.stencilFunc ?? null,
		shaderStencilFuncMask: r.stencilFuncMask ?? null,
		shaderStencilWriteMask: r.stencilWriteMask ?? null,
		shaderStencilZPass: r.stencilZPass ?? null,
		shaderDepthFunc: r.depthFunc ?? null,
		shaderDepthWrite: r.depthWrite ?? null,
		shaderTransparent: r.transparent ?? null,
		renderOrder: Xt(typeof r.userData.pjskMaterialKind == "string" ? r.userData.pjskMaterialKind : "")
	});
}
function on(e, t) {
	let n = e.clone();
	return Ve(n, {
		baseColor: t.baseColor ?? e.uniforms.uBaseColor.value.clone(),
		warmColor: t.warmColor ?? e.uniforms.uWarmColor.value.clone(),
		skinColorDefault: t.skinColorDefault ?? e.uniforms.uSkinColorDefault.value.clone(),
		skinColor1: t.skinColor1 ?? e.uniforms.uSkinColor1.value.clone(),
		skinColor2: t.skinColor2 ?? e.uniforms.uSkinColor2.value.clone(),
		mainTex: t.mainTex ?? null,
		shadowTex: t.shadowTex ?? null,
		valueTex: t.valueTex ?? null,
		faceShadowTex: t.faceShadowTex ?? null,
		lightDirection: e.uniforms.uLightDirection.value.clone(),
		lightIntensity: e.uniforms.uLightIntensity.value,
		ambientIntensity: e.uniforms.uAmbientIntensity.value,
		headDotDirectionalLight: e.uniforms.uHeadDotDirectionalLight?.value,
		faceDebugMode: e.uniforms.uFaceDebugMode?.value ?? 0,
		faceSdfEnabled: !1,
		useValueTex: t.lighting?.useValueTex ?? !!t.valueTex,
		shadowThreshold: t.lighting?.sekaiShadowThreshold ?? e.uniforms.uShadowThreshold?.value ?? .5,
		shadowWeight: e.uniforms.uShadowWeight?.value ?? 1,
		shadowWidth: t.lighting?.shadowWidth ?? e.uniforms.uShadowWidth?.value ?? 0,
		fadeMode: t.lighting?.fadeMode ?? e.uniforms.uFadeMode?.value ?? 0,
		useLambert: t.lighting?.useLambert ?? !0,
		shadowTexWeight: t.lighting?.shadowTexWeight ?? e.uniforms.uShadowTexWeight?.value ?? 1,
		useFaceShadowLimiter: t.lighting?.useFaceShadowLimiter ?? (e.uniforms.uUseFaceShadowLimiter?.value ?? 1) > .5,
		faceShadowLimitRange: t.lighting?.rangeLimit ?? e.uniforms.uFaceShadowLimitRange?.value ?? 0,
		hueSinAngle: t.lighting?.hueSinAngle ?? e.uniforms.uHueSinAngle?.value ?? 0,
		hueCosAngle: t.lighting?.hueCosAngle ?? e.uniforms.uHueCosAngle?.value ?? 1,
		saturation: t.lighting?.saturation ?? e.uniforms.uSaturation?.value ?? .5,
		value: t.lighting?.value ?? e.uniforms.uValue?.value ?? .5,
		contrast: t.lighting?.contrast ?? e.uniforms.uContrast?.value ?? .5,
		partsAmbientColor: t.lighting?.partsAmbientColor ?? (e.uniforms.uPartsAmbientColor ? e.uniforms.uPartsAmbientColor.value.clone() : "#ffffff"),
		partsAmbientAlpha: e.uniforms.uPartsAmbientAlpha?.value ?? 0,
		controllerAmbientColor: e.uniforms.uControllerAmbientColor ? e.uniforms.uControllerAmbientColor.value.clone() : new y.Color().setRGB(E.ambientColor.r, E.ambientColor.g, E.ambientColor.b),
		controllerAmbientIntensity: e.uniforms.uControllerAmbientIntensity?.value ?? 1,
		controllerSpecularColor: e.uniforms.uControllerSpecularColor ? e.uniforms.uControllerSpecularColor.value.clone() : new y.Color().setRGB(E.specularColor.r, E.specularColor.g, E.specularColor.b),
		controllerSpecularIntensity: e.uniforms.uControllerSpecularIntensity?.value ?? 1,
		controllerRimColor: e.uniforms.uControllerRimColor ? e.uniforms.uControllerRimColor.value.clone() : new y.Color().setRGB(E.rimColor.r, E.rimColor.g, E.rimColor.b),
		controllerShadowRimColor: e.uniforms.uControllerShadowRimColor ? e.uniforms.uControllerShadowRimColor.value.clone() : new y.Color().setRGB(E.shadowRimColor.r, E.shadowRimColor.g, E.shadowRimColor.b),
		controllerRimColorWeight: e.uniforms.uControllerRimColorWeight?.value ?? 1,
		controllerShadowRimColorWeight: e.uniforms.uControllerShadowRimColorWeight?.value ?? 1,
		controllerRimRange: e.uniforms.uControllerRimRange?.value ?? E.rimRange,
		controllerRimEdgeSmoothness: e.uniforms.uControllerRimEdgeSmoothness?.value ?? E.rimEdgeSmoothness,
		controllerRimEmission: e.uniforms.uControllerRimEmission?.value ?? E.rimEmission,
		controllerRimLightInfluence: e.uniforms.uControllerRimLightInfluence?.value ?? E.rimLightInfluence,
		controllerRimShadowSharpness: e.uniforms.uControllerRimShadowSharpness?.value ?? E.rimShadowSharpness,
		rimColorAlpha: e.uniforms.uRimColorAlpha?.value ?? E.rimColorAlpha,
		rimDirection: e.uniforms.uRimDirection?.value.clone(),
		specularPower: t.lighting?.specularPower ?? e.uniforms.uSpecularPower?.value ?? 0,
		rimThreshold: t.lighting?.rimThreshold ?? e.uniforms.uRimThreshold?.value ?? .2,
		globalShadowColor: e.uniforms.uGlobalShadowColor ? e.uniforms.uGlobalShadowColor.value.clone() : "#ffffff",
		globalShadowAlpha: e.uniforms.uGlobalShadowAlpha?.value ?? 1
	}), n;
}
function sn(e, t) {
	let n = new Set(t);
	for (let t of e) n.has(t) || t.dispose();
}
function cn(e) {
	return !!e.geometry?.getAttribute("uv1");
}
function ln(e, t) {
	return {
		tintColor: e?.tintColor,
		emissionColor: e?.emissionColor,
		lightInfluence: e?.lightInfluence ?? t?.lightInfluence,
		distortionFps: t?.distortionFps,
		distortionIntensity: t?.distortionIntensity,
		distortionIntensityX: t?.distortionIntensityX,
		distortionIntensityY: t?.distortionIntensityY,
		distortionOffsetX: t?.distortionOffsetX,
		distortionOffsetY: t?.distortionOffsetY,
		distortionScrollSpeed: t?.distortionScrollSpeed,
		distortionScrollX: t?.distortionScrollX,
		distortionScrollY: t?.distortionScrollY,
		distortionTexTilingX: t?.distortionTexTilingX,
		distortionTexTilingY: t?.distortionTexTilingY,
		threshold: t?.threshold
	};
}
function un(e, t) {
	return {
		...ln(e, t),
		highlightInfluence: e?.lightInfluenceForEyeHighlight ?? t?.lightInfluenceForEyeHighlight
	};
}
async function dn({ root: e, headAsset: t, textureLoader: n, templates: r, view: i, hair: a, eyeController: o, debug: s = [] }) {
	let c = [], l = [], u = [], d = await Promise.all(t.faceMaterials.map(async (e) => {
		let [s, c, l, u] = await Promise.all([
			V(n, e.mainTex),
			V(n, e.shadowTex),
			V(n, e.valueTex, y.NoColorSpace),
			V(n, e.faceShadowTex, y.NoColorSpace)
		]);
		if (z(s, e.rawMaterial, "_MainTex"), z(c, e.rawMaterial, "_ShadowTex"), z(l, e.rawMaterial, "_ValueTex"), z(u, e.rawMaterial, "_FaceShadowTex"), !e.materialKind) throw Error(`Head material ${e.materialName ?? e.materialKey} is missing materialKind.`);
		let d = e.materialKind, f = !!e.isAccessory || d === "accessory", p = Ut(d, e.lighting, e.rawMaterial), m, h = null, g = null;
		if (d === "eye") {
			let t = ln(o, p);
			m = M(s, "eye", o?.baseTiling, {
				...t,
				strictAlpha: !0
			}), m.side = y.FrontSide;
			let n = M(s, "eye", o?.baseTiling, t);
			n.side = y.FrontSide, Jt(n, H), n.userData.pjskMaterialKind = "eye_stencil_prepass";
			let r = M(s, "eye", o?.baseTiling, {
				...t,
				strictAlpha: !0
			});
			r.side = y.FrontSide, Kt(r, H, "eye", e.rawMaterial), r.userData.pjskMaterialKind = "eye_through_hair", m.userData.pjskOverlayMaterial = r, m.userData.pjskStencilPrepassMaterial = n;
		} else if (d === "eyelight") {
			let t = un(o, p);
			h = M(s, "eyelight", o?.highlightTiling, t), h.side = y.FrontSide, m = h.clone(), m.visible = !1, m.colorWrite = !1, m.depthWrite = !1;
			let n = M(s, "eyelight", o?.highlightTiling, t);
			n.side = y.FrontSide, Kt(n, H, "eyelight", e.rawMaterial), n.userData.pjskMaterialKind = "eyelight_through_hair", m.userData.pjskOverlayMaterial = n;
		} else if (d === "eyelash" || d === "eyebrow") {
			m = M(s, "alpha", null, { vertexBViewOffset: .015 }), g = on(r.face, {
				mainTex: s,
				shadowTex: c,
				valueTex: l,
				faceShadowTex: u,
				baseColor: t.proxy.faceColor,
				warmColor: t.proxy.faceShadeColor,
				skinColorDefault: t.proxy.skinColorDefault ?? t.proxy.faceColor,
				skinColor1: t.proxy.skinColor1 ?? t.proxy.faceShadeColor,
				skinColor2: t.proxy.skinColor2 ?? t.proxy.faceShadeColor,
				lighting: p
			}), m.side = y.FrontSide;
			let n = M(s, "alpha", null, { strictAlpha: !0 });
			n.side = y.FrontSide, Jt(n, H), n.userData.pjskMaterialKind = d === "eyelash" ? "eyelash_stencil_prepass" : "eyebrow_stencil_prepass";
			let i = M(s, "alpha", null, { strictAlpha: !0 });
			i.side = y.FrontSide, Kt(i, H, d, e.rawMaterial), i.userData.pjskMaterialKind = d === "eyelash" ? "eyelash_through_hair" : "eyebrow_through_hair", m.userData.pjskOverlayMaterial = i, m.userData.pjskStencilPrepassMaterial = n;
		} else if (d === "hair") m = Rt(r.hair, {
			mainTex: s,
			shadowTex: c,
			valueTex: l,
			baseColor: t.proxy.hairColor,
			shadowColor: t.proxy.hairShadowColor,
			lighting: p,
			hairShadowEnabled: a.proximityShadowEnabled && a.controllerPresent && p?.hairShadow === !0,
			useLambert: a.controllerPresent ? !0 : p?.useLambert ?? !0,
			headPosition: a.headPosition,
			bodyDebugMode: i.bodyDebugMode,
			alphaCutoff: tn
		}), Yt(m, H);
		else if (d === "accessory" || d === "body") m = Rt(r.body, {
			mainTex: s,
			shadowTex: c,
			valueTex: l,
			baseColor: t.proxy.skinColorDefault ?? t.proxy.faceColor,
			shadowColor: t.proxy.skinColor1 ?? t.proxy.faceShadeColor,
			skinColorDefault: t.proxy.skinColorDefault ?? t.proxy.faceColor,
			skinColor1: t.proxy.skinColor1 ?? t.proxy.faceShadeColor,
			skinColor2: t.proxy.skinColor2 ?? t.proxy.faceShadeColor,
			lighting: p,
			bodyDebugMode: i.bodyDebugMode,
			alphaCutoff: d === "accessory" ? nn : 0
		}), Gt(m);
		else {
			let e = on(r.face, {
				mainTex: s,
				shadowTex: c,
				valueTex: l,
				faceShadowTex: u,
				baseColor: t.proxy.faceColor,
				warmColor: t.proxy.faceShadeColor,
				skinColorDefault: t.proxy.skinColorDefault ?? t.proxy.faceColor,
				skinColor1: t.proxy.skinColor1 ?? t.proxy.faceShadeColor,
				skinColor2: t.proxy.skinColor2 ?? t.proxy.faceShadeColor,
				lighting: p
			});
			e.uniforms.uFaceDebugMode && (e.uniforms.uFaceDebugMode.value = i.faceDebugMode), e.side = y.FrontSide, Gt(e), m = e;
		}
		return Wt(m, e.rawMaterial), g && (Wt(g, e.rawMaterial), m.userData.pjskOutlineSourceMaterial = g), m.userData.pjskLighting = p, m.userData.pjskRawMaterial = e.rawMaterial, m.userData.pjskMaterialKind = d, m.userData.pjskIsAccessory = f, m.userData.pjskMaterialKey = e.materialKey, m.userData.pjskMaterialSlotIndex = e.slotIndex, h && (h.userData.pjskLighting = p, h.userData.pjskRawMaterial = e.rawMaterial, h.userData.pjskMaterialKind = d, h.userData.pjskIsAccessory = f, h.userData.pjskMaterialKey = e.materialKey, h.userData.pjskMaterialSlotIndex = e.slotIndex), {
			key: e.materialKey,
			meshKey: Ht(e.meshName),
			materialKey: e.materialKey,
			materialKind: d,
			mainTex: e.mainTex ?? null,
			shadowTex: e.shadowTex ?? null,
			valueTex: e.valueTex ?? null,
			faceShadowTex: e.faceShadowTex ?? null,
			material: m,
			overlayMaterial: m.userData.pjskOverlayMaterial instanceof y.Material ? m.userData.pjskOverlayMaterial : null,
			stencilPrepassMaterial: m.userData.pjskStencilPrepassMaterial instanceof y.Material ? m.userData.pjskStencilPrepassMaterial : null,
			topLayerMaterial: h
		};
	}));
	e.traverse((e) => {
		let t = e;
		if (!t.isMesh || t.userData.pjskEyeThroughHairOverlay || t.userData.pjskEyeThroughHairStencilPrepass) return;
		let n = Array.isArray(t.material) ? t.material : [t.material], r = Ht(t.name), a = d.filter((e) => e.meshKey === r);
		if (a.length === 0) return;
		let o = [], f = n.map((e, n) => {
			let r = typeof e.userData.pjskMaterialKey == "string" ? e.userData.pjskMaterialKey : "";
			if (!r) throw Error(`Head mesh '${t.name}' material '${e.name}' is missing pjskMaterialKey; regenerate it with Haruki-3D-Exporter materialKey runtime support.`);
			let c = a.find((e) => e.materialKey === r);
			if (!c) throw Error(`Head mesh '${t.name}' material key '${r}' was not found in head material slots.`);
			let l = Bt(e);
			Vt(c.material, l), c.overlayMaterial && Vt(c.overlayMaterial, l), c.stencilPrepassMaterial && Vt(c.stencilPrepassMaterial, l), c.topLayerMaterial && Vt(c.topLayerMaterial, l);
			let u = !1;
			if (c.material instanceof y.ShaderMaterial && !c.material.uniforms.uMainTex.value && l) {
				c.material.uniforms.uMainTex.value = l, c.material.uniforms.uMainTexTransform && (c.material.uniforms.uMainTexTransform.value = l.matrix), c.material.uniforms.uUseMainTex.value = 1;
				for (let e of [
					c.overlayMaterial,
					c.stencilPrepassMaterial,
					c.topLayerMaterial
				]) e instanceof y.ShaderMaterial && (e.uniforms.uMainTex.value = l, e.uniforms.uMainTexTransform && (e.uniforms.uMainTexTransform.value = l.matrix), e.uniforms.uUseMainTex.value = 1);
				"uBaseColor" in c.material.uniforms && c.material.uniforms.uBaseColor.value.set("#ffffff"), u = !0;
			}
			c.material instanceof y.MeshBasicMaterial && !c.material.map && l && (c.material.map = l, c.material.needsUpdate = !0, u = !0), t.renderOrder = Xt(c.materialKind), t.userData.pjskMaterialKind = c.materialKind;
			let d = c.material instanceof y.ShaderMaterial ? c.material.uniforms : null, f = cn(t), p = c.material.userData.pjskLighting, m = c.materialKind === "face_sdf" && !!c.faceShadowTex && p?.useFaceSdf !== !1;
			return c.material instanceof y.ShaderMaterial && d?.uFaceShadowTex && (c.material.userData.pjskFaceSdfCapable = m, c.material.userData.pjskFaceSdfUv1Available = f, d.uFaceSdfEnabled.value = i.faceSdfEnabled && m ? 1 : 0), o[n] = c, rn(s, t, e, c, u, m, f), c.material;
		}), p = o.reduce((e, t) => t ? Math.min(e, Xt(t.materialKind)) : e, Infinity);
		Number.isFinite(p) && (t.renderOrder = p);
		let m = t.geometry.groups.length > 0 ? t.geometry.groups.map((e) => ({
			start: e.start,
			count: e.count,
			materialIndex: e.materialIndex ?? 0
		})) : [{
			start: 0,
			count: t.geometry.index?.count ?? t.geometry.getAttribute("position")?.count ?? 0,
			materialIndex: 0
		}], h = [], g = [], _ = [], v = [], b = [], ee = [];
		for (let e of m) {
			let r = o[e.materialIndex], i = r?.topLayerMaterial ?? null;
			if (i) {
				let r = b.length;
				b.push(i), ee.push({
					start: e.start,
					count: e.count,
					materialIndex: r
				}), an(s, t.name, n[e.materialIndex]?.name ?? "", i);
			}
			let a = r?.overlayMaterial ?? null;
			if (a) {
				let t = h.length;
				h.push(a), g.push({
					start: e.start,
					count: e.count,
					materialIndex: t
				});
			}
			let c = r?.stencilPrepassMaterial ?? null;
			if (c) {
				let r = _.length;
				_.push(c), v.push({
					start: e.start,
					count: e.count,
					materialIndex: r
				}), an(s, t.name, n[e.materialIndex]?.name ?? "", c, !1);
			}
			a && an(s, t.name, n[e.materialIndex]?.name ?? "", a);
		}
		sn(n, f), Zt(t, f), t.material = Array.isArray(t.material) || f.length > 1 ? f : f[0], t.castShadow = !1, t.receiveShadow = !1;
		for (let e of v) {
			let n = _[e.materialIndex];
			if (!n) continue;
			let r = $t(t, [{
				start: e.start,
				count: e.count,
				materialIndex: 0
			}], [n]);
			r && t.parent && (r.name = `${t.name}_eye_stencil_prepass`, r.userData.pjskEyeThroughHairPassKind = "stencil_prepass", r.userData.pjskEyeThroughHairStencilPrepass = !0, r.userData.pjskEyeThroughHairOverlay = !1, l.push({
				parent: t.parent,
				mesh: r
			}));
		}
		for (let e of g) {
			let n = h[e.materialIndex];
			if (!n) continue;
			let r = $t(t, [{
				start: e.start,
				count: e.count,
				materialIndex: 0
			}], [n]);
			r && t.parent && c.push({
				parent: t.parent,
				mesh: r
			});
		}
		for (let e of ee) {
			let n = b[e.materialIndex];
			if (!n) continue;
			let r = Qt(t, [{
				start: e.start,
				count: e.count,
				materialIndex: 0
			}], [n], "eyelight_top_layer");
			r && t.parent && (r.userData.pjskTopLayerSource = t, r.userData.pjskMaterialKind = typeof n.userData.pjskMaterialKind == "string" ? n.userData.pjskMaterialKind : null, u.push({
				parent: t.parent,
				mesh: r
			}));
		}
	});
	for (let e of l) e.parent.add(e.mesh);
	for (let e of c) e.parent.add(e.mesh);
	for (let e of u) e.parent.add(e.mesh);
	return s;
}
//#endregion
//#region src/engine/sekaiOutlineRuntime.ts
var U = {
	widthMin: 4e-4,
	widthMax: .0095,
	distanceNear: .45,
	distanceFar: 20
}, fn = {
	startTime: -.013763427734375,
	startValue: 27.81246566772461,
	startOutTangent: -.13214513659477234,
	endTime: 100.92341613769531,
	endValue: -.03620624542236328,
	endInTangent: -.5713597536087036
};
function pn(e) {
	let t = Number.isFinite(e) ? e : 25, n = fn, r;
	if (t <= n.startTime) r = n.startValue;
	else if (t >= n.endTime) r = n.endValue;
	else {
		let e = n.endTime - n.startTime, i = (t - n.startTime) / e, a = i * i, o = a * i;
		r = (2 * o - 3 * a + 1) * n.startValue + (o - 2 * a + i) * e * n.startOutTangent + (-2 * o + 3 * a) * n.endValue + (o - a) * e * n.endInTangent;
	}
	return Math.abs(r) > 2 ** -52 ? t / r : 1;
}
var W = {
	color: {
		r: 0,
		g: 0,
		b: 0
	},
	blending: .5
};
function mn() {
	return new y.Vector2(U.widthMin, U.widthMax);
}
function hn(e) {
	return !e?.disabledShaderPasses?.some((e) => e.toLowerCase() === "outline");
}
var gn = {
	r: .52,
	g: .47,
	b: .55,
	a: 1
};
function _n(e, t, n, r) {
	let i = y.MathUtils.clamp(r, 0, 1), a = {
		r: e.r * t.r,
		g: e.g * t.g,
		b: e.b * t.b
	};
	return {
		r: a.r + i * (n.r - a.r),
		g: a.g + i * (n.g - a.g),
		b: a.b + i * (n.b - a.b)
	};
}
function vn(e, t, n) {
	if (e.name !== "pjsk_shell_outline") return;
	let r = e.userData.pjskOutlineController;
	r && (t && typeof t == "object" && "r" in t && "g" in t && "b" in t ? r.color.setRGB(t.r, t.g, t.b) : O(r.color, t ?? new y.Color().setRGB(W.color.r, W.color.g, W.color.b)), r.blending = y.MathUtils.clamp(n ?? W.blending, 0, 1));
}
function yn(e, t, n, r) {
	let i = new y.Vector3(U.distanceNear, 1 / (U.distanceFar - U.distanceNear), pn(25)), a = {
		color: new y.Color().setRGB(W.color.r, W.color.g, W.color.b),
		blending: W.blending
	}, o = L(n, "_OutlineOffset") ?? 0, s = e.clone();
	s.name = "pjsk_shell_outline", s.side = y.BackSide, s.transparent = !1, s.opacity = 1, s.depthFunc = y.LessDepth, s.depthWrite = !0, s.depthTest = !0, s.blending = y.NoBlending, s.polygonOffset = !1, s.userData = {
		...e.userData,
		pjskOutlineController: a
	};
	let c = {};
	for (let t of [
		"uFaceSdfEnabled",
		"uRimColorAlpha",
		"uControllerSpecularIntensity"
	]) t in e.uniforms && (c[t] = { value: 0 });
	return s.uniforms = {
		...e.uniforms,
		...c,
		uSekaiOutlineWidth: { value: mn() },
		uSekaiOutlineFactor: { value: i },
		uSekaiOutlineOffset: { value: o },
		uSekaiCharacterOutlineColor: { value: a.color },
		uSekaiCharacterOutlineBlending: { get value() {
			return a.blending;
		} }
	}, s.vertexShader = e.vertexShader.replace("#include <common>", [
		"#include <common>",
		"uniform vec2 uSekaiOutlineWidth;",
		"uniform vec3 uSekaiOutlineFactor;",
		"uniform float uSekaiOutlineOffset;",
		r ? "attribute vec4 tangent;" : "",
		r ? "attribute vec2 uv1;" : "",
		r ? "attribute vec2 uv2;" : ""
	].join("\n")), s.vertexShader = s.vertexShader.replace("#include <defaultnormal_vertex>", [
		"#include <defaultnormal_vertex>",
		"#ifdef FLIP_SIDED",
		"transformedNormal = -transformedNormal;",
		"#endif"
	].join("\n")), s.vertexShader = s.vertexShader.replace("#include <begin_vertex>", [
		"#include <begin_vertex>",
		"vec3 outlineWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;",
		"float outlineDistance = length(outlineWorldPosition - cameraPosition);",
		"float outlineDistanceFactor = clamp((outlineDistance - uSekaiOutlineFactor.x) * uSekaiOutlineFactor.y, 0.0, 1.0);",
		"outlineDistanceFactor = min(outlineDistanceFactor * uSekaiOutlineFactor.z, 1.0);",
		"float outlineWidth = mix(uSekaiOutlineWidth.x, uSekaiOutlineWidth.y, outlineDistanceFactor);",
		r ? ["vec3 outlineSecondBitangent = cross(normal, tangent.xyz) * tangent.w;", "vec3 outlineDirection = normalize(tangent.xyz * uv1.x + outlineSecondBitangent * uv1.y + normal * uv2.x);"].join("\n") : "vec3 outlineDirection = normalize(normal);",
		t ? "float outlineScale = clamp(color.r, 0.0, 1.0);" : "float outlineScale = 1.0;",
		t ? "float outlineOffsetScale = clamp(color.b, 0.0, 1.0);" : "float outlineOffsetScale = 0.0;",
		"transformed += outlineDirection * outlineWidth * outlineScale;"
	].join("\n")), s.vertexShader = s.vertexShader.replace(/gl_Position\s*=\s*projectionMatrix\s*\*[^;]*;/, (e) => [
		e,
		"vec4 projectedCameraOrigin = projectionMatrix * viewMatrix * vec4(cameraPosition, 1.0);",
		"gl_Position += projectedCameraOrigin * (-0.01 * uSekaiOutlineOffset) * outlineOffsetScale;"
	].join("\n")), s.fragmentShader = e.fragmentShader.replace(/vec3 outputColor\s*\(\s*vec3 color\s*\)\s*\{\s*return color;\s*\}/, [
		"uniform vec3 uSekaiCharacterOutlineColor;",
		"uniform float uSekaiCharacterOutlineBlending;",
		"",
		"vec3 outputColor(vec3 color) {",
		"  return mix(",
		"    uSekaiCharacterOutlineColor,",
		"    clamp(color, 0.0, 1.0),",
		"    clamp(uSekaiCharacterOutlineBlending, 0.0, 1.0)",
		"  );",
		"}"
	].join("\n")), s.customProgramCacheKey = () => `sekai-toon-outline:${+!!t}:${+!!r}`, s.onBeforeRender = (e, t, n) => {
		n instanceof y.PerspectiveCamera && (i.z = pn(n.fov));
	}, s;
}
function bn(e, t, n = !1, r = null, i = null) {
	if (i instanceof y.ShaderMaterial && /vec3 outputColor\s*\(\s*vec3 color\s*\)/.test(i.fragmentShader)) return yn(i, e, t, n);
	let a = R(t, "_OutlineColor") ?? gn, o = Ft(t, "_MainTex"), s = new y.Vector4(o?.scaleX ?? 1, o?.scaleY ?? 1, o?.offsetX ?? 0, o?.offsetY ?? 0), c = (L(t, "_UseAlphaClip") ?? 0) > .5, l = y.MathUtils.clamp(L(t, "_Cutoff") ?? .5, 0, 1), u = L(t, "_OutlineOffset") ?? 0, d = new y.Color().setRGB(a.r, a.g, a.b), f = {
		color: new y.Color().setRGB(W.color.r, W.color.g, W.color.b),
		blending: W.blending
	}, p = new y.MeshBasicMaterial({
		color: d,
		map: r,
		side: y.BackSide,
		transparent: !1,
		opacity: 1,
		depthFunc: y.LessDepth,
		depthWrite: !0,
		depthTest: !0,
		blending: y.NoBlending,
		vertexColors: !1,
		alphaTest: c ? l : 0
	}), m = new y.Vector3(U.distanceNear, 1 / (U.distanceFar - U.distanceNear), pn(25));
	return p.name = "pjsk_shell_outline", p.userData.pjskOutlineController = f, p.onBeforeCompile = (t) => {
		t.uniforms.uSekaiOutlineWidth = { value: mn() }, t.uniforms.uSekaiOutlineFactor = { value: m }, t.uniforms.uSekaiOutlineOffset = { value: u }, t.uniforms.uSekaiMainTexST = { value: s }, t.uniforms.uSekaiCharacterOutlineColor = { value: f.color }, t.uniforms.uSekaiCharacterOutlineBlending = { get value() {
			return f.blending;
		} }, t.vertexShader = t.vertexShader.replace("#include <common>", [
			"#include <common>",
			"uniform vec2 uSekaiOutlineWidth;",
			"uniform vec3 uSekaiOutlineFactor;",
			"uniform float uSekaiOutlineOffset;",
			"uniform vec4 uSekaiMainTexST;",
			"#ifdef USE_MAP",
			"varying vec2 vSekaiMainTexUv;",
			"#endif",
			e ? "attribute vec3 color;" : "",
			n ? "attribute vec4 tangent;" : "",
			n ? "attribute vec2 uv1;" : "",
			n ? "attribute vec2 uv2;" : ""
		].join("\n")), t.vertexShader = t.vertexShader.replace("#include <begin_vertex>", [
			"#include <begin_vertex>",
			"vec3 outlineWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;",
			"float outlineDistance = length(outlineWorldPosition - cameraPosition);",
			"float outlineDistanceFactor = clamp((outlineDistance - uSekaiOutlineFactor.x) * uSekaiOutlineFactor.y, 0.0, 1.0);",
			"outlineDistanceFactor = min(outlineDistanceFactor * uSekaiOutlineFactor.z, 1.0);",
			"float outlineWidth = mix(uSekaiOutlineWidth.x, uSekaiOutlineWidth.y, outlineDistanceFactor);",
			n ? ["vec3 outlineSecondBitangent = cross(normal, tangent.xyz) * tangent.w;", "vec3 outlineDirection = normalize(tangent.xyz * uv1.x + outlineSecondBitangent * uv1.y + normal * uv2.x);"].join("\n") : "vec3 outlineDirection = normalize(normal);",
			e ? "float outlineScale = clamp(color.r, 0.0, 1.0);" : "float outlineScale = 1.0;",
			e ? "float outlineOffsetScale = clamp(color.b, 0.0, 1.0);" : "float outlineOffsetScale = 0.0;",
			"transformed += outlineDirection * outlineWidth * outlineScale;"
		].join("\n")), t.vertexShader = t.vertexShader.replace("#include <project_vertex>", [
			"#include <project_vertex>",
			"vec4 projectedCameraOrigin = projectionMatrix * viewMatrix * vec4(cameraPosition, 1.0);",
			"gl_Position += projectedCameraOrigin * (-0.01 * uSekaiOutlineOffset) * outlineOffsetScale;"
		].join("\n")), t.vertexShader = t.vertexShader.replace("#include <uv_vertex>", [
			"#include <uv_vertex>",
			"#ifdef USE_MAP",
			"vSekaiMainTexUv = uv * uSekaiMainTexST.xy + uSekaiMainTexST.zw;",
			"#endif"
		].join("\n")), t.fragmentShader = t.fragmentShader.replace("#include <common>", [
			"#include <common>",
			"uniform vec3 uSekaiCharacterOutlineColor;",
			"uniform float uSekaiCharacterOutlineBlending;",
			"#ifdef USE_MAP",
			"varying vec2 vSekaiMainTexUv;",
			"#endif"
		].join("\n")), t.fragmentShader = t.fragmentShader.replace("#include <map_fragment>", [
			"#ifdef USE_MAP",
			"  vec4 sampledDiffuseColor = texture2D(map, vSekaiMainTexUv);",
			"  #ifdef DECODE_VIDEO_TEXTURE",
			"    sampledDiffuseColor = sRGBTransferEOTF(sampledDiffuseColor);",
			"  #endif",
			"  sampledDiffuseColor = sRGBTransferOETF(sampledDiffuseColor);",
			"  diffuseColor *= sampledDiffuseColor;",
			"#endif"
		].join("\n")), t.fragmentShader = t.fragmentShader.replace("#include <color_fragment>", [
			"#include <color_fragment>",
			"diffuseColor.rgb = mix(",
			"  diffuseColor.rgb,",
			"  uSekaiCharacterOutlineColor,",
			"  clamp(uSekaiCharacterOutlineBlending, 0.0, 1.0)",
			");"
		].join("\n")), t.fragmentShader = t.fragmentShader.replace("#include <colorspace_fragment>", "");
	}, p.customProgramCacheKey = () => `sekai-outline:${+!!e}:${+!!n}`, p.onBeforeRender = (e, t, n) => {
		n instanceof y.PerspectiveCamera && (m.z = pn(n.fov));
	}, p;
}
//#endregion
//#region src/engine/characterLightingRuntime.ts
function xn(e) {
	return e === "head_proximity" ? "sekai_head_position" : e;
}
var Sn = {
	skin: 1,
	main_color: 2,
	skin_color: 3,
	h_r: 4,
	h_g: 5,
	h_b: 6,
	h_a: 7,
	vertex_r: 8,
	vertex_g: 9,
	base_shadow: 10,
	ndotl_raw: 11,
	h_b_adjusted_shadow: 12,
	ambient_target: 13,
	ambient_weight: 14,
	ambient_tint: 15,
	specular: 16,
	rim_raw: 17,
	rim_add: 18,
	rim_gate: 19,
	rim_color: 20,
	rim_scalar: 21,
	specular_mask: 22,
	specular_add: 23,
	toon_luma: 24,
	shadow_mask: 25,
	shadow_target: 26
}, Cn = {
	sdf: 1,
	mask: 2,
	limit: 3,
	basis: 4,
	range: 5
};
function wn(e) {
	return Sn[e] ?? 0;
}
function Tn(e) {
	return Cn[e] ?? 0;
}
function En(e) {
	return e === "eyelash" || e === "eyebrow" || e === "eye" || e === "eyelight";
}
function Dn(e) {
	return e === "face" || e === "face_sdf" || En(e);
}
function On(e, t) {
	switch (t) {
		case "eye_through_hair_eye_only": return e === "eye";
		case "eye_through_hair_eyebrow_only": return e === "eyebrow";
		case "eye_through_hair_eyelash_only": return e === "eyelash";
		case "no_eye_through_hair_eye": return e !== "eye";
		case "no_eye_through_hair_eyebrow": return e !== "eyebrow";
		case "no_eye_through_hair_eyelash": return e !== "eyelash";
		default: return !0;
	}
}
function kn(e, t, n) {
	return n === "no_eye_through_hair_eyelash_overlay" ? e !== "eyelash" || t !== "overlay" : n !== "no_eye_through_hair_eyelash_prepass" || e !== "eyelash" || t !== "stencil_prepass";
}
function An(e, t) {
	switch (t) {
		case "no_body_outline": return e === "body";
		case "no_hair_outline": return e === "hair";
		case "no_face_layers":
		case "no_face_outline": return Dn(e);
		default: return !1;
	}
}
var jn = class {
	options;
	cameraDirection = new y.Vector3();
	hairShadowMode = "sekai_head_position";
	bodyDebugMode = "off";
	toonShadowWidthOverride = null;
	toonValueShadowInfluence;
	faceSdfEnabled = !0;
	faceSdfDebugMode = "off";
	faceSdfDebugLightMode = "scene";
	renderIsolationMode = "normal";
	controllerOutlineColor = new y.Color().setRGB(W.color.r, W.color.g, W.color.b);
	controllerOutlineBlending = W.blending;
	skinColors = null;
	constructor(e) {
		this.options = e, this.toonValueShadowInfluence = e.valueShadowInfluence ?? 1, e.debug.hairShadowMode = this.hairShadowMode;
	}
	get slots() {
		return [this.options.bodySlot, this.options.headSlot];
	}
	get debugEntries() {
		return [this.options.debug.body, this.options.debug.head];
	}
	forEachShaderMaterial(e) {
		for (let t of this.slots) t.traverse((t) => {
			let n = t;
			if (!n.isMesh) return;
			let r = Array.isArray(n.material) ? n.material : [n.material];
			for (let t of r) t instanceof y.ShaderMaterial && e(t);
		});
	}
	getBindingView() {
		return {
			bodyDebugMode: wn(this.bodyDebugMode),
			faceDebugMode: Tn(this.faceSdfDebugMode),
			faceSdfEnabled: this.shouldEnableFaceSdf(),
			shadowWidthOverride: this.toonShadowWidthOverride,
			valueShadowInfluence: this.toonValueShadowInfluence,
			proximityHairShadowEnabled: this.isHairShadowEnabled()
		};
	}
	getHairShadowMode() {
		return this.hairShadowMode;
	}
	isHairShadowEnabled() {
		return this.hairShadowMode === "sekai_head_position";
	}
	setHairShadowMode(e) {
		this.hairShadowMode = xn(e), this.options.debug.hairShadowMode = this.hairShadowMode, this.applyHairShadowMode();
	}
	setFaceSdfDebugMode(e) {
		this.faceSdfDebugMode = e, this.applyFaceSdfDebug();
	}
	setFaceSdfEnabled(e) {
		this.faceSdfEnabled = e, this.applyFaceSdfEnabled();
	}
	setBodyDebugMode(e) {
		this.bodyDebugMode = e, this.applyBodyDebug();
	}
	setToonShadowPreview(e, t) {
		this.toonShadowWidthOverride = e === null ? null : Math.max(0, e), this.toonValueShadowInfluence = y.MathUtils.clamp(t, 0, 1), this.applyToonShadowPreview();
	}
	setFaceSdfDebugLightMode(e) {
		this.faceSdfDebugLightMode = e, this.applyFaceSdfDebug();
	}
	setRenderIsolationMode(e) {
		this.renderIsolationMode = e, this.applyRenderIsolationMode();
	}
	resolveFaceShadowLightDirection(e, t, n) {
		switch (this.faceSdfDebugLightMode) {
			case "front": return n.clone();
			case "left": return t.clone().negate();
			case "right": return t.clone();
			case "back": return n.clone().negate();
			default: return e.clone();
		}
	}
	applyCharacterView() {
		this.applyRenderIsolationMode(), this.applyFaceSdfDebug(), this.applyBodyDebug(), this.applyToonShadowPreview(), this.applyHairShadowMode(), this.applyCharacterSkinColors();
	}
	setCharacterSkinColors(e) {
		this.skinColors = e ? { ...e } : null, this.options.debug.skinColors = this.skinColors ? { ...this.skinColors } : null, this.applyCharacterSkinColors();
	}
	applyCharacterSkinColors() {
		let e = this.skinColors;
		if (!e) return;
		let t = (t) => {
			t.uniforms.uSkinColorDefault && O(t.uniforms.uSkinColorDefault.value, e.default), t.uniforms.uSkinColor1 && O(t.uniforms.uSkinColor1.value, e.shadow1), t.uniforms.uSkinColor2 && O(t.uniforms.uSkinColor2.value, e.shadow2);
		};
		[
			this.options.bodyMaterial,
			this.options.hairMaterial,
			this.options.faceMaterial
		].forEach(t), this.forEachShaderMaterial(t);
		for (let t of this.debugEntries) for (let n of t) n.shaderSkinColorDefault !== void 0 && n.shaderSkinColorDefault !== null && (n.shaderSkinColorDefault = e.default.toLowerCase()), n.shaderSkinColor1 !== void 0 && n.shaderSkinColor1 !== null && (n.shaderSkinColor1 = e.shadow1.toLowerCase()), n.shaderSkinColor2 !== void 0 && n.shaderSkinColor2 !== null && (n.shaderSkinColor2 = e.shadow2.toLowerCase());
	}
	shouldEnableFaceSdf() {
		return this.renderIsolationMode === "no_face_sdf" ? !1 : this.faceSdfEnabled || this.renderIsolationMode === "face_sdf";
	}
	applyFaceSdfEnabled() {
		let e = this.shouldEnableFaceSdf(), t = (t) => {
			t.uniforms.uFaceSdfEnabled && (t.uniforms.uFaceSdfEnabled.value = e && t.userData.pjskFaceSdfCapable === !0 ? 1 : 0);
		};
		t(this.options.faceMaterial), this.forEachShaderMaterial(t);
		for (let t of this.debugEntries) for (let n of t) (n.shaderFaceSdfEnabled !== void 0 || n.resolvedKind === "face_sdf") && (n.shaderFaceSdfEnabled = e && n.faceSdfCapable === !0 ? 1 : 0);
	}
	applyFaceSdfDebug() {
		let e = Tn(this.faceSdfDebugMode);
		this.options.faceMaterial.uniforms.uFaceDebugMode.value = e, this.forEachShaderMaterial((t) => {
			t.uniforms.uFaceDebugMode && (t.uniforms.uFaceDebugMode.value = e);
		});
		for (let t of this.debugEntries) for (let n of t) (n.resolvedKind === "face_sdf" || n.shaderFaceDebugMode !== void 0) && (n.shaderFaceDebugMode = e);
	}
	applyBodyDebug() {
		let e = wn(this.bodyDebugMode), t = (t) => {
			t.uniforms.uBodyDebugMode && (t.uniforms.uBodyDebugMode.value = e);
		};
		t(this.options.bodyMaterial), t(this.options.hairMaterial), this.forEachShaderMaterial(t);
		for (let t of this.debugEntries) for (let n of t) (n.shaderBodyDebugMode !== void 0 || n.resolvedKind === "body") && (n.shaderBodyDebugMode = e);
	}
	applyToonShadowPreview() {
		let e = this.toonShadowWidthOverride ?? -1, t = (t) => {
			t instanceof y.ShaderMaterial && (t.uniforms.uShadowWidthOverride && (t.uniforms.uShadowWidthOverride.value = e), t.uniforms.uValueShadowInfluence && (t.uniforms.uValueShadowInfluence.value = this.toonValueShadowInfluence));
		};
		t(this.options.bodyMaterial), t(this.options.hairMaterial), this.forEachShaderMaterial(t);
		for (let t of this.debugEntries) for (let n of t) n.shaderShadowWidthOverride !== void 0 && n.shaderShadowWidthOverride !== null && n.shaderValueShadowInfluence !== void 0 && n.shaderValueShadowInfluence !== null && (n.shaderShadowWidthOverride = e, n.shaderValueShadowInfluence = this.toonValueShadowInfluence);
	}
	applyHairShadowMode() {
		let e = +!!this.isHairShadowEnabled();
		this.options.hairMaterial.uniforms.uHairShadowEnabled && (this.options.hairMaterial.uniforms.uHairShadowEnabled.value = e), this.forEachShaderMaterial((t) => {
			t.userData.pjskMaterialKind === "hair" && t.uniforms.uHairShadowEnabled && (t.uniforms.uHairShadowEnabled.value = e);
		});
		for (let t of this.options.debug.head) t.resolvedKind === "hair" && t.shaderHairShadowEnabled !== void 0 && (t.shaderHairShadowEnabled = e);
	}
	applyRenderIsolationMode() {
		let e = this.shouldEnableFaceSdf(), t = this.renderIsolationMode, n = t === "eyelight_only", r = t === "no_eyelight", i = t !== "no_face_layers", a = t === "outline_only", o = t !== "no_outline", s = t === "no_eye_through_hair", c = t === "eye_through_hair_only" || t === "eye_through_hair_eye_only" || t === "eye_through_hair_eyebrow_only" || t === "eye_through_hair_eyelash_only", l = (l) => {
			let u = l;
			if (!u.isMesh) return;
			if (u.userData.pjskEyeThroughHairOverlay || u.userData.pjskEyeThroughHairStencilPrepass) {
				let e = u.userData.pjskEyeThroughHairSource, o = typeof u.userData.pjskEyeThroughHairSourceKind == "string" ? u.userData.pjskEyeThroughHairSourceKind : "", c = typeof u.userData.pjskEyeThroughHairPassKind == "string" ? u.userData.pjskEyeThroughHairPassKind : "", l = e instanceof y.Object3D ? e.visible : !0;
				e instanceof y.Object3D && (u.layers.mask = e.layers.mask), u.visible = l && !a && !n && !s && On(o, t) && kn(o, c, t) && i && (!r || o !== "eyelight"), u.userData.pjskEyeThroughHairBaseVisible = u.visible;
				return;
			}
			if (u.userData.pjskOutlineShell) {
				let e = typeof u.userData.pjskSourceMaterialKind == "string" ? u.userData.pjskSourceMaterialKind : "", a = Dn(e);
				if (n) {
					u.visible = e === "eye" || e === "eyelight";
					return;
				}
				u.visible = !c && o && !An(e, t) && (!r || e !== "eyelight") && (!a || i);
				return;
			}
			let d = Array.isArray(u.material) ? u.material : [u.material], f = !1, p = !1;
			for (let t of d) {
				if (!(t instanceof y.ShaderMaterial)) continue;
				let n = t.visible !== !1 && t.colorWrite !== !1;
				t.uniforms.uFaceSdfEnabled && (t.uniforms.uFaceSdfEnabled.value = e && t.userData.pjskFaceSdfCapable === !0 ? 1 : 0, f = !0), t.uniforms.uMode && !t.uniforms.uFaceSdfEnabled && (f = !0, p ||= n && t.uniforms.uMode.value > 1.5);
			}
			a || c ? u.visible = !1 : n ? u.visible = f && d.some((e) => e.userData.pjskMaterialKind === "eye" || e.userData.pjskMaterialKind === "eyelight") : f ? u.visible = i && (!r || !p) : u.visible = !n;
			let m = u.userData.pjskEyeThroughHairSource;
			m instanceof y.Object3D && (u.visible = u.visible && m.visible, u.layers.mask = m.layers.mask);
		};
		for (let e of this.slots) e.traverse(l);
		for (let t of this.debugEntries) for (let n of t) (n.shaderFaceSdfEnabled !== void 0 || n.resolvedKind === "face_sdf") && (n.shaderFaceSdfEnabled = e && n.faceSdfCapable === !0 ? 1 : 0);
	}
	updateEyeThroughHairView(e, t, n) {
		let r = this.cameraDirection.copy(e).sub(t), i = r.lengthSq() > 1e-6 ? r.normalize().dot(n) : 1;
		for (let e of this.slots) e.traverse((e) => {
			let t = e;
			if (!t.isMesh || !t.userData.pjskEyeThroughHairOverlay && !t.userData.pjskEyeThroughHairStencilPrepass) return;
			let n = t.userData.pjskEyeThroughHairBaseVisible, r = typeof n == "boolean" ? n : t.visible;
			if (t.userData.pjskEyeThroughHairStencilPrepass) {
				t.visible = r;
				return;
			}
			let a = Array.isArray(t.material) ? t.material : [t.material], o = !1;
			for (let e of a) {
				let t = qt(e, i);
				o ||= t === null || t > .001;
			}
			t.visible = r && o;
		});
	}
	updateCamera(e) {
		ze(this.options.bodyMaterial, e), ze(this.options.hairMaterial, e), this.forEachShaderMaterial((t) => {
			t.uniforms.uCameraPosition && ze(t, e);
		});
	}
	updateFaceBasis(e, t, n) {
		He(this.options.faceMaterial, e, t, !0, 0), this.forEachShaderMaterial((r) => {
			r.uniforms.uHeadDotDirectionalLight && He(r, e, t, !0, 0), r.uniforms.uHeadPosition && r.uniforms.uHeadPosition.value.copy(n);
		});
	}
	updatePreviewLight(e, t, n, r, i, a = B()) {
		let o = this.getBindingView(), { bodyMaterial: s, hairMaterial: c, faceMaterial: l, directionalLight: u, fillLight: d } = this.options;
		u.position.set(e.x, e.y, e.z), u.intensity = e.intensity, d.intensity = e.ambient, Re(s, {
			baseColor: t?.proxy.bodyColor ?? "#f5d6d0",
			shadowColor: t?.proxy.shadowColor ?? "#c79b95",
			skinColorDefault: n?.proxy.skinColorDefault ?? n?.proxy.faceColor ?? t?.proxy.bodyColor ?? "#f5d6d0",
			skinColor1: n?.proxy.skinColor1 ?? n?.proxy.faceShadeColor ?? t?.proxy.shadowColor ?? "#c79b95",
			skinColor2: n?.proxy.skinColor2 ?? n?.proxy.faceShadeColor ?? t?.proxy.shadowColor ?? "#c79b95",
			lightDirection: u.position.clone(),
			lightIntensity: e.intensity,
			ambientIntensity: e.ambient,
			shadowThreshold: e.shadowThreshold,
			shadowWeight: e.shadowWeight,
			characterAmbientIntensity: e.characterAmbient,
			rimColorAlpha: e.rimColorAlpha,
			controllerRimRange: e.rimRange,
			controllerRimEdgeSmoothness: e.rimEdgeSmoothness,
			controllerRimEmission: e.rimEmission,
			controllerRimLightInfluence: e.rimLightInfluence,
			rimDirection: a,
			specularPower: s.uniforms.uSpecularPower.value,
			rimThreshold: s.uniforms.uRimThreshold.value,
			shadowTexWeight: s.uniforms.uShadowTexWeight.value,
			shadowWidthOverride: o.shadowWidthOverride,
			valueShadowInfluence: o.valueShadowInfluence,
			saturation: s.uniforms.uSaturation.value,
			partsAmbientColor: s.uniforms.uPartsAmbientColor.value.clone(),
			reflectionBlendColor: s.uniforms.uReflectionBlendColor.value.clone(),
			globalShadowColor: s.uniforms.uGlobalShadowColor.value.clone(),
			globalShadowAlpha: s.uniforms.uGlobalShadowAlpha.value,
			controllerAmbientColor: s.uniforms.uControllerAmbientColor.value.clone(),
			controllerAmbientIntensity: s.uniforms.uControllerAmbientIntensity.value,
			controllerSpecularColor: s.uniforms.uControllerSpecularColor.value.clone(),
			controllerSpecularIntensity: s.uniforms.uControllerSpecularIntensity.value,
			controllerRimColor: s.uniforms.uControllerRimColor.value.clone(),
			controllerShadowRimColor: s.uniforms.uControllerShadowRimColor.value.clone(),
			controllerRimColorWeight: s.uniforms.uControllerRimColorWeight.value,
			controllerShadowRimColorWeight: s.uniforms.uControllerShadowRimColorWeight.value,
			controllerRimShadowSharpness: e.rimShadowSharpness,
			bodyDebugMode: o.bodyDebugMode
		}), Re(c, {
			baseColor: n?.proxy.hairColor ?? "#7b5b4a",
			shadowColor: n?.proxy.hairShadowColor ?? "#513d33",
			lightDirection: u.position.clone(),
			lightIntensity: e.intensity,
			ambientIntensity: e.ambient,
			shadowThreshold: e.shadowThreshold,
			shadowWeight: e.shadowWeight,
			characterAmbientIntensity: e.characterAmbient,
			rimColorAlpha: e.rimColorAlpha,
			controllerRimRange: e.rimRange,
			controllerRimEdgeSmoothness: e.rimEdgeSmoothness,
			controllerRimEmission: e.rimEmission,
			controllerRimLightInfluence: e.rimLightInfluence,
			rimDirection: a,
			specularPower: c.uniforms.uSpecularPower.value,
			rimThreshold: c.uniforms.uRimThreshold.value,
			shadowTexWeight: c.uniforms.uShadowTexWeight.value,
			shadowWidthOverride: o.shadowWidthOverride,
			valueShadowInfluence: o.valueShadowInfluence,
			saturation: c.uniforms.uSaturation.value,
			partsAmbientColor: c.uniforms.uPartsAmbientColor.value.clone(),
			reflectionBlendColor: c.uniforms.uReflectionBlendColor.value.clone(),
			globalShadowColor: c.uniforms.uGlobalShadowColor.value.clone(),
			globalShadowAlpha: c.uniforms.uGlobalShadowAlpha.value,
			controllerAmbientColor: c.uniforms.uControllerAmbientColor.value.clone(),
			controllerAmbientIntensity: c.uniforms.uControllerAmbientIntensity.value,
			controllerSpecularColor: c.uniforms.uControllerSpecularColor.value.clone(),
			controllerSpecularIntensity: c.uniforms.uControllerSpecularIntensity.value,
			controllerRimColor: c.uniforms.uControllerRimColor.value.clone(),
			controllerShadowRimColor: c.uniforms.uControllerShadowRimColor.value.clone(),
			controllerRimColorWeight: c.uniforms.uControllerRimColorWeight.value,
			controllerShadowRimColorWeight: c.uniforms.uControllerShadowRimColorWeight.value,
			controllerRimShadowSharpness: e.rimShadowSharpness,
			hairShadowEnabled: !1
		}), Ve(l, {
			baseColor: n?.proxy.faceColor ?? "#ffe4dc",
			warmColor: n?.proxy.faceShadeColor ?? "#ffd4c8",
			skinColorDefault: n?.proxy.skinColorDefault ?? n?.proxy.faceColor ?? "#ffe4dc",
			skinColor1: n?.proxy.skinColor1 ?? n?.proxy.faceShadeColor ?? "#ffd4c8",
			skinColor2: n?.proxy.skinColor2 ?? n?.proxy.faceShadeColor ?? "#ffd4c8",
			lightDirection: i.clone(),
			lightIntensity: e.intensity,
			ambientIntensity: e.ambient,
			headDotDirectionalLight: r,
			shadowWeight: e.shadowWeight,
			useLambert: !0,
			useFaceShadowLimiter: !0,
			faceShadowLimitRange: 0,
			partsAmbientColor: l.uniforms.uPartsAmbientColor.value.clone(),
			partsAmbientAlpha: l.uniforms.uPartsAmbientAlpha.value,
			controllerAmbientColor: l.uniforms.uControllerAmbientColor.value.clone(),
			controllerAmbientIntensity: l.uniforms.uControllerAmbientIntensity.value,
			controllerSpecularColor: l.uniforms.uControllerSpecularColor.value.clone(),
			controllerSpecularIntensity: l.uniforms.uControllerSpecularIntensity.value,
			controllerRimColor: l.uniforms.uControllerRimColor.value.clone(),
			controllerShadowRimColor: l.uniforms.uControllerShadowRimColor.value.clone(),
			controllerRimColorWeight: l.uniforms.uControllerRimColorWeight.value,
			controllerShadowRimColorWeight: l.uniforms.uControllerShadowRimColorWeight.value,
			controllerRimRange: e.rimRange,
			controllerRimEdgeSmoothness: e.rimEdgeSmoothness,
			controllerRimEmission: e.rimEmission,
			controllerRimLightInfluence: e.rimLightInfluence,
			controllerRimShadowSharpness: e.rimShadowSharpness,
			rimColorAlpha: e.rimColorAlpha,
			rimDirection: a,
			specularPower: l.uniforms.uSpecularPower.value,
			rimThreshold: l.uniforms.uRimThreshold.value,
			globalShadowColor: l.uniforms.uGlobalShadowColor.value.clone(),
			globalShadowAlpha: l.uniforms.uGlobalShadowAlpha.value
		}), this.updateLoadedMaterialLight(e, i, a), this.applyCharacterSkinColors();
	}
	updateLoadedMaterialLight(e, t, n = B()) {
		let r = this.options.directionalLight.position.clone().normalize();
		this.forEachShaderMaterial((i) => {
			let a = i.uniforms, o = i.userData.pjskLighting, s = !!(a.uFaceShadowTex || a.uHeadDotDirectionalLight);
			a.uLightDirection?.value.copy(s ? t : r), a.uLightIntensity && (a.uLightIntensity.value = e.intensity), a.uAmbientIntensity && (a.uAmbientIntensity.value = e.ambient), a.uShadowThreshold && (a.uShadowThreshold.value = o?.sekaiShadowThreshold ?? e.shadowThreshold), a.uShadowWeight && (a.uShadowWeight.value = e.shadowWeight), a.uCharacterAmbientIntensity && (a.uCharacterAmbientIntensity.value = e.characterAmbient), a.uRimColorAlpha && (a.uRimColorAlpha.value = e.rimColorAlpha), a.uControllerRimRange && (a.uControllerRimRange.value = e.rimRange), a.uControllerRimEdgeSmoothness && (a.uControllerRimEdgeSmoothness.value = e.rimEdgeSmoothness), a.uControllerRimEmission && (a.uControllerRimEmission.value = e.rimEmission), a.uControllerRimLightInfluence && (a.uControllerRimLightInfluence.value = e.rimLightInfluence), a.uControllerRimShadowSharpness && (a.uControllerRimShadowSharpness.value = e.rimShadowSharpness), a.uRimDirection?.value.copy(n);
		});
	}
	updateGlobalShadowColor(e, t = 1) {
		let n = O(new y.Color(), e), r = y.MathUtils.clamp(t, 0, 1), i = (e) => {
			e.uniforms.uGlobalShadowColor?.value.copy(n), e.uniforms.uGlobalShadowAlpha && (e.uniforms.uGlobalShadowAlpha.value = r);
		};
		for (let e of [this.options.bodyMaterial, this.options.hairMaterial]) i(e);
		this.forEachShaderMaterial(i);
	}
	updateControllerColors(e) {
		let t = e.ambientColor == null ? new y.Color().setRGB(E.ambientColor.r, E.ambientColor.g, E.ambientColor.b) : O(new y.Color(), e.ambientColor), n = O(new y.Color(), e.specularColor ?? "#ffffff"), r = e.rimColor == null ? new y.Color().setRGB(E.rimColor.r, E.rimColor.g, E.rimColor.b) : O(new y.Color(), e.rimColor), i = e.shadowRimColor == null ? new y.Color().setRGB(E.shadowRimColor.r, E.shadowRimColor.g, E.shadowRimColor.b) : O(new y.Color(), e.shadowRimColor), a = (a) => {
			a.uniforms.uControllerAmbientColor?.value.copy(t), a.uniforms.uControllerAmbientIntensity && (a.uniforms.uControllerAmbientIntensity.value = Math.max(e.ambientIntensity ?? 1, 0)), a.uniforms.uControllerSpecularColor?.value.copy(n), a.uniforms.uControllerSpecularIntensity && (a.uniforms.uControllerSpecularIntensity.value = Math.max(e.specularIntensity ?? 1, 0)), a.uniforms.uControllerRimColor?.value.copy(r), a.uniforms.uControllerShadowRimColor?.value.copy(i), a.uniforms.uControllerRimColorWeight && (a.uniforms.uControllerRimColorWeight.value = 1), a.uniforms.uControllerShadowRimColorWeight && (a.uniforms.uControllerShadowRimColorWeight.value = 1);
		};
		for (let e of [this.options.bodyMaterial, this.options.hairMaterial]) a(e);
		this.forEachShaderMaterial(a);
	}
	updateControllerRimShape(e) {
		let t = Math.max(e.edgeSmoothness ?? E.rimEdgeSmoothness, 0), n = Math.max(e.emission ?? E.rimEmission, 0), r = y.MathUtils.clamp(e.shadowSharpness ?? E.rimShadowSharpness, 0, 1), i = (e) => {
			e.uniforms.uControllerRimEdgeSmoothness && (e.uniforms.uControllerRimEdgeSmoothness.value = t), e.uniforms.uControllerRimEmission && (e.uniforms.uControllerRimEmission.value = n), e.uniforms.uControllerRimShadowSharpness && (e.uniforms.uControllerRimShadowSharpness.value = r);
		};
		for (let e of [this.options.bodyMaterial, this.options.hairMaterial]) i(e);
		this.forEachShaderMaterial(i);
	}
	updateControllerOutline(e) {
		this.controllerOutlineColor = e.color ? O(new y.Color(), e.color) : new y.Color().setRGB(W.color.r, W.color.g, W.color.b), this.controllerOutlineBlending = y.MathUtils.clamp(e.blending ?? W.blending, 0, 1);
		for (let e of this.slots) e.traverse((e) => {
			let t = e;
			if (!t.isMesh || !t.userData.pjskOutlineShell) return;
			let n = Array.isArray(t.material) ? t.material : [t.material];
			for (let e of n) e.userData.pjskOutlineController && this.applyOutlineMaterial(e);
		});
	}
	applyOutlineMaterial(e) {
		vn(e, this.controllerOutlineColor, this.controllerOutlineBlending);
	}
}, Mn = class {
	constructor(e = 4) {
		this.pool = e, this.queue = [], this.workers = [], this.workersResolve = [], this.workerStatus = 0, this.workerCreator = null;
	}
	_initWorker(e) {
		if (!this.workers[e]) {
			let t = this.workerCreator();
			t.addEventListener("message", this._onMessage.bind(this, e)), this.workers[e] = t;
		}
	}
	_getIdleWorker() {
		for (let e = 0; e < this.pool; e++) if (!(this.workerStatus & 1 << e)) return e;
		return -1;
	}
	_onMessage(e, t) {
		let n = this.workersResolve[e];
		if (n && n(t), this.queue.length) {
			let { resolve: t, msg: n, transfer: r } = this.queue.shift();
			this.workersResolve[e] = t, this.workers[e].postMessage(n, r);
		} else this.workerStatus ^= 1 << e;
	}
	setWorkerCreator(e) {
		this.workerCreator = e;
	}
	setWorkerLimit(e) {
		this.pool = e;
	}
	postMessage(e, t) {
		return new Promise((n) => {
			let r = this._getIdleWorker();
			r === -1 ? this.queue.push({
				resolve: n,
				msg: e,
				transfer: t
			}) : (this._initWorker(r), this.workerStatus |= 1 << r, this.workersResolve[r] = n, this.workers[r].postMessage(e, t));
		});
	}
	dispose() {
		this.workers.forEach((e) => e.terminate()), this.workersResolve.length = 0, this.workers.length = 0, this.queue.length = 0, this.workerStatus = 0;
	}
}, Nn = 1000066e3, Pn = class {
	constructor() {
		this.vkFormat = 0, this.typeSize = 1, this.pixelWidth = 0, this.pixelHeight = 0, this.pixelDepth = 0, this.layerCount = 0, this.faceCount = 1, this.supercompressionScheme = 0, this.levels = [], this.dataFormatDescriptor = [{
			vendorId: 0,
			descriptorType: 0,
			descriptorBlockSize: 0,
			versionNumber: 2,
			colorModel: 0,
			colorPrimaries: 1,
			transferFunction: 2,
			flags: 0,
			texelBlockDimension: [
				0,
				0,
				0,
				0
			],
			bytesPlane: [
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			],
			samples: []
		}], this.keyValue = {}, this.globalData = null;
	}
}, Fn = class {
	constructor(e, t, n, r) {
		this._dataView = void 0, this._littleEndian = void 0, this._offset = void 0, this._dataView = new DataView(e.buffer, e.byteOffset + t, n), this._littleEndian = r, this._offset = 0;
	}
	_nextUint8() {
		let e = this._dataView.getUint8(this._offset);
		return this._offset += 1, e;
	}
	_nextUint16() {
		let e = this._dataView.getUint16(this._offset, this._littleEndian);
		return this._offset += 2, e;
	}
	_nextUint32() {
		let e = this._dataView.getUint32(this._offset, this._littleEndian);
		return this._offset += 4, e;
	}
	_nextUint64() {
		let e = this._dataView.getUint32(this._offset, this._littleEndian) + 2 ** 32 * this._dataView.getUint32(this._offset + 4, this._littleEndian);
		return this._offset += 8, e;
	}
	_nextInt32() {
		let e = this._dataView.getInt32(this._offset, this._littleEndian);
		return this._offset += 4, e;
	}
	_nextUint8Array(e) {
		let t = new Uint8Array(this._dataView.buffer, this._dataView.byteOffset + this._offset, e);
		return this._offset += e, t;
	}
	_skip(e) {
		return this._offset += e, this;
	}
	_scan(e, t) {
		t === void 0 && (t = 0);
		let n = this._offset, r = 0;
		for (; this._dataView.getUint8(this._offset) !== t && r < e;) r++, this._offset++;
		return r < e && this._offset++, new Uint8Array(this._dataView.buffer, this._dataView.byteOffset + n, r);
	}
};
new Uint8Array([0]);
var G = [
	171,
	75,
	84,
	88,
	32,
	50,
	48,
	187,
	13,
	10,
	26,
	10
];
function In(e) {
	return new TextDecoder().decode(e);
}
function Ln(e) {
	let t = new Uint8Array(e.buffer, e.byteOffset, G.length);
	if (t[0] !== G[0] || t[1] !== G[1] || t[2] !== G[2] || t[3] !== G[3] || t[4] !== G[4] || t[5] !== G[5] || t[6] !== G[6] || t[7] !== G[7] || t[8] !== G[8] || t[9] !== G[9] || t[10] !== G[10] || t[11] !== G[11]) throw Error("Missing KTX 2.0 identifier.");
	let n = new Pn(), r = 17 * Uint32Array.BYTES_PER_ELEMENT, i = new Fn(e, G.length, r, !0);
	n.vkFormat = i._nextUint32(), n.typeSize = i._nextUint32(), n.pixelWidth = i._nextUint32(), n.pixelHeight = i._nextUint32(), n.pixelDepth = i._nextUint32(), n.layerCount = i._nextUint32(), n.faceCount = i._nextUint32();
	let a = i._nextUint32();
	n.supercompressionScheme = i._nextUint32();
	let o = i._nextUint32(), s = i._nextUint32(), c = i._nextUint32(), l = i._nextUint32(), u = i._nextUint64(), d = i._nextUint64(), f = new Fn(e, G.length + r, 3 * a * 8, !0);
	for (let t = 0; t < a; t++) n.levels.push({
		levelData: new Uint8Array(e.buffer, e.byteOffset + f._nextUint64(), f._nextUint64()),
		uncompressedByteLength: f._nextUint64()
	});
	let p = new Fn(e, o, s, !0), m = {
		vendorId: p._skip(4)._nextUint16(),
		descriptorType: p._nextUint16(),
		versionNumber: p._nextUint16(),
		descriptorBlockSize: p._nextUint16(),
		colorModel: p._nextUint8(),
		colorPrimaries: p._nextUint8(),
		transferFunction: p._nextUint8(),
		flags: p._nextUint8(),
		texelBlockDimension: [
			p._nextUint8(),
			p._nextUint8(),
			p._nextUint8(),
			p._nextUint8()
		],
		bytesPlane: [
			p._nextUint8(),
			p._nextUint8(),
			p._nextUint8(),
			p._nextUint8(),
			p._nextUint8(),
			p._nextUint8(),
			p._nextUint8(),
			p._nextUint8()
		],
		samples: []
	}, h = (m.descriptorBlockSize / 4 - 6) / 4;
	for (let e = 0; e < h; e++) {
		let t = {
			bitOffset: p._nextUint16(),
			bitLength: p._nextUint8(),
			channelType: p._nextUint8(),
			samplePosition: [
				p._nextUint8(),
				p._nextUint8(),
				p._nextUint8(),
				p._nextUint8()
			],
			sampleLower: -Infinity,
			sampleUpper: Infinity
		};
		64 & t.channelType ? (t.sampleLower = p._nextInt32(), t.sampleUpper = p._nextInt32()) : (t.sampleLower = p._nextUint32(), t.sampleUpper = p._nextUint32()), m.samples[e] = t;
	}
	n.dataFormatDescriptor.length = 0, n.dataFormatDescriptor.push(m);
	let g = new Fn(e, c, l, !0);
	for (; g._offset < l;) {
		let e = g._nextUint32(), t = g._scan(e), r = In(t);
		if (n.keyValue[r] = g._nextUint8Array(e - t.byteLength - 1), r.match(/^ktx/i)) {
			let e = In(n.keyValue[r]);
			n.keyValue[r] = e.substring(0, e.lastIndexOf("\0"));
		}
		g._skip(e % 4 ? 4 - e % 4 : 0);
	}
	if (d <= 0) return n;
	let _ = new Fn(e, u, d, !0), v = _._nextUint16(), y = _._nextUint16(), b = _._nextUint32(), ee = _._nextUint32(), te = _._nextUint32(), ne = _._nextUint32(), re = [];
	for (let e = 0; e < a; e++) re.push({
		imageFlags: _._nextUint32(),
		rgbSliceByteOffset: _._nextUint32(),
		rgbSliceByteLength: _._nextUint32(),
		alphaSliceByteOffset: _._nextUint32(),
		alphaSliceByteLength: _._nextUint32()
	});
	let ie = u + _._offset, x = ie + b, S = x + ee, ae = S + te;
	return n.globalData = {
		endpointCount: v,
		selectorCount: y,
		imageDescs: re,
		endpointsData: new Uint8Array(e.buffer, e.byteOffset + ie, b),
		selectorsData: new Uint8Array(e.buffer, e.byteOffset + x, ee),
		tablesData: new Uint8Array(e.buffer, e.byteOffset + S, te),
		extendedData: new Uint8Array(e.buffer, e.byteOffset + ae, ne)
	}, n;
}
//#endregion
//#region node_modules/three/examples/jsm/libs/zstddec.module.js
var Rn, K, zn, Bn = { env: { emscripten_notify_memory_growth: function(e) {
	zn = new Uint8Array(K.exports.memory.buffer);
} } }, Vn = class {
	init() {
		return Rn || (Rn = typeof fetch < "u" ? fetch("data:application/wasm;base64," + Hn).then((e) => e.arrayBuffer()).then((e) => WebAssembly.instantiate(e, Bn)).then(this._init) : WebAssembly.instantiate(Buffer.from(Hn, "base64"), Bn).then(this._init), Rn);
	}
	_init(e) {
		K = e.instance, Bn.env.emscripten_notify_memory_growth(0);
	}
	decode(e, t = 0) {
		if (!K) throw Error("ZSTDDecoder: Await .init() before decoding.");
		let n = e.byteLength, r = K.exports.malloc(n);
		zn.set(e, r), t ||= Number(K.exports.ZSTD_findDecompressedSize(r, n));
		let i = K.exports.malloc(t), a = K.exports.ZSTD_decompress(i, t, r, n), o = zn.slice(i, i + a);
		return K.exports.free(r), K.exports.free(i), o;
	}
}, Hn = "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IAMNACAEQQNxBEADQCACRQ0FIAAgAkF/aiICaiIDIAEgAmotAAA6AAAgA0EDcQ0ACwsgAkEDTQ0AA0AgACACQXxqIgJqIAEgAmooAgA2AgAgAkEDSw0ACwsgAkUNAgNAIAAgAkF/aiICaiABIAJqLQAAOgAAIAINAAsMAgsgAkEDTQ0AIAIhBANAIAMgASgCADYCACABQQRqIQEgA0EEaiEDIARBfGoiBEEDSw0ACyACQQNxIQILIAJFDQADQCADIAEtAAA6AAAgA0EBaiEDIAFBAWohASACQX9qIgINAAsLIAAL8wICAn8BfgJAIAJFDQAgACACaiIDQX9qIAE6AAAgACABOgAAIAJBA0kNACADQX5qIAE6AAAgACABOgABIANBfWogAToAACAAIAE6AAIgAkEHSQ0AIANBfGogAToAACAAIAE6AAMgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBfGogATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQXhqIAE2AgAgAkF0aiABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkFwaiABNgIAIAJBbGogATYCACACQWhqIAE2AgAgAkFkaiABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa0iBUIghiAFhCEFIAMgBGohAQNAIAEgBTcDGCABIAU3AxAgASAFNwMIIAEgBTcDACABQSBqIQEgAkFgaiICQR9LDQALCyAACy8BAn8gACgCBCAAKAIAQQJ0aiICLQACIQMgACACLwEAIAEgAi0AAxAIajYCACADCy8BAn8gACgCBCAAKAIAQQJ0aiICLQACIQMgACACLwEAIAEgAi0AAxAFajYCACADCx8AIAAgASACKAIEEAg2AgAgARAEGiAAIAJBCGo2AgQLCAAgAGdBH3MLugUBDX8jAEEQayIKJAACfyAEQQNNBEAgCkEANgIMIApBDGogAyAEEAsaIAAgASACIApBDGpBBBAVIgBBbCAAEAMbIAAgACAESxsMAQsgAEEAIAEoAgBBAXRBAmoQECENQVQgAygAACIGQQ9xIgBBCksNABogAiAAQQVqNgIAIAMgBGoiAkF8aiEMIAJBeWohDiACQXtqIRAgAEEGaiELQQQh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ASIDNgLE4AEgACgCvOABIQQgACABNgK84AEgACABIAJqNgK44AEgACABIAQgA2tqNgLA4AELpgEBAX8gACAAKALs4QEQFjYCyOABIABCADcD+OABIABCADcDuOABIABBwOABakIANwMAIABBqNAAaiIBQYyAgOAANgIAIABBADYCmOIBIABCADcDiOEBIABCAzcDgOEBIABBrNABakHgEikCADcCACAAQbTQAWpB6BIoAgA2AgAgACABNgIMIAAgAEGYIGo2AgggACAAQaAwajYCBCAAIABBEGo2AgALYQEBf0G4fyEDAkAgAUEDSQ0AIAIgABAhIgFBA3YiADYCCCACIAFBAXE2AgQgAiABQQF2QQNxIgM2AgACQCADQX9qIgFBAksNAAJAIAFBAWsOAgEAAgtBbA8LIAAhAwsgAwsMACAAIAEgAkEAEC4LiAQCA38CfiADEBYhBCAAQQBBKBAQIQAgBCACSwRAIAQPCyABRQRAQX8PCwJAAkAgA0EBRg0AIAEoAAAiBkGo6r5pRg0AQXYhAyAGQXBxQdDUtMIBRw0BQQghAyACQQhJDQEgAEEAQSgQECEAIAEoAAQhASAAQQE2AhQgACABrTcDAEEADwsgASACIAMQLyIDIAJLDQAgACADNgIYQXIhAyABIARqIgVBf2otAAAiAkEIcQ0AIAJBIHEiBkUEQEFwIQMgBS0AACIFQacBSw0BIAVBB3GtQgEgBUEDdkEKaq2GIgdCA4h+IAd8IQggBEEBaiEECyACQQZ2IQMgAkECdiEFAkAgAkEDcUF/aiICQQJLBEBBACECDAELAkACQAJAIAJBAWsOAgECAAsgASAEai0AACECIARBAWohBAwCCyABIARqLwAAIQIgBEECaiEEDAELIAEgBGooAAAhAiAEQQRqIQQLIAVBAXEhBQJ+AkACQAJAIANBf2oiA0ECTQRAIANBAWsOAgIDAQtCfyAGRQ0DGiABIARqMQAADAMLIAEgBGovAACtQoACfAwCCyABIARqKAAArQwBCyABIARqKQAACyEHIAAgBTYCICAAIAI2AhwgACAHNwMAQQAhAyAAQQA2AhQgACAHIAggBhsiBzcDCCAAIAdCgIAIIAdCgIAIVBs+AhALIAMLWwEBf0G4fyEDIAIQFiICIAFNBH8gACACakF/ai0AACIAQQNxQQJ0QaAeaigC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C0Egak8NAQsgByAHKQNoNwMQIAcgBykDYDcDCCAEIA0gB0EIaiAHQdwAaiAPIA4gESAQEB4hCwwBCyACIARqIQggBCAKEAcgAkERTwRAIARBEGohAgNAIAIgCkEQaiIKEAcgAkEQaiICIAhJDQALCyAIIAlrIQIgByATNgJcIAkgCCAOa0sEQCAJIAggEWtLBEBBbCELDAILIBAgAiAOayICaiIKIANqIBBNBEAgCCAKIAMQDxoMAgsgCCAKQQAgAmsQDyEIIAcgAiADaiIDNgJkIAggAmshCCAOIQILIAlBEE8EQCADIAhqIQMDQCAIIAIQByACQRBqIQIgCEEQaiIIIANJDQALDAELAkAgCUEHTQRAIAggAi0AADoAACAIIAItAAE6AAEgCCACLQACOgACIAggAi0AAzoAAyAIQQRqIAIgCUECdCIDQcAeaigCAGoiAhAXIAIgA0HgHmooAgBrIQIgBygCZCEDDAELIAggAhAMCyADQQlJDQAgAyAIaiEDIAhBCGoiCCACQQhqIgJrQQ9MBEADQCAIIAIQDCACQQhqIQIgCEEIaiIIIANJDQAMAgALAAsDQCAIIAIQByACQRBqIQIgCEEQaiIIIANJDQALCyAHQRhqEAQaIAsgDCALEAMiAhshDCAEIAQgC2ogAhshBCAFQX9qIgUNAAsgDBADDQFBbCEMIAdBGGoQBEECSQ0BQQAhCANAIAhBA0cEQCAAIAhBAnQiAmpBrNABaiACIAdqKAJENgIAIAhBAWohCAwBCwsgBygCXCEIC0G6fyEMIA8gCGsiACANIARrSw0AIAQEfyAEIAggABALIABqBUEACyABayEMCyAHQfAAaiQAIAwLkRcCFn8FfiMAQdABayIHJAAgByAAKALw4QEiCDYCvAEgASACaiESIAggACgCgOIBaiETAkACQCAFRQRAIAEhAwwBCyAAKALE4AEhESAAKALA4AEhFSAAKAK84AEhDyAAQQE2AozhAUEAIQgDQCAIQQNHBEAgByAIQQJ0IgJqIAAgAmpBrNABaigCADYCVCAIQQFqIQgMAQsLIAcgETYCZCAHIA82AmAgByABIA9rNgJoQWwhECAHQShqIAMgBBAGEAMNASAFQQQgBUEESBshFyAHQTxqIAdBKGogACgCABATIAdBxABqIAdBKGogACgCCBATIAdBzABqIAdB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IAdB0AFqJAAgEAslACAAQgA3AgAgAEEAOwEIIABBADoACyAAIAE2AgwgACACOgAKC7QFAQN/IwBBMGsiBCQAIABB/wFqIgVBfWohBgJAIAMvAQIEQCAEQRhqIAEgAhAGIgIQAw0BIARBEGogBEEYaiADEBwgBEEIaiAEQRhqIAMQHCAAIQMDQAJAIARBGGoQBCADIAZPckUEQCADIARBEGogBEEYahASOgAAIAMgBEEIaiAEQRhqEBI6AAEgBEEYahAERQ0BIANBAmohAwsgBUF+aiEFAn8DQEG6fyECIAMiASAFSw0FIAEgBEEQaiAEQRhqEBI6AAAgAUEBaiEDIARBGGoQBEEDRgRAQQIhAiAEQQhqDAILIAMgBUsNBSABIARBCGogBEEYahASOgABIAFBAmohA0EDIQIgBEEYahAEQQNHDQALIARBEGoLIQUgAyAFIARBGGoQEjoAACABIAJqIABrIQIMAwsgAyAEQRBqIARBGGoQEjoAAiADIARBCGogBEEYahASOgADIANBBGohAwwAAAsACyAEQRhqIAEgAhAGIgIQAw0AIARBEGogBEEYaiADEBwgBEEIaiAEQRhqIAMQHCAAIQMDQAJAIARBGGoQBCADIAZPckUEQCADIARBEGogBEEYahAROgAAIAMgBEEIaiAEQRhqEBE6AAEgBEEYahAERQ0BIANBAmohAwsgBUF+aiEFAn8DQEG6fyECIAMiASAFSw0EIAEgBEEQaiAEQRhqEBE6AAAgAUEBaiEDIARBGGoQBEEDRgRAQQIhAiAEQQhqDAILIAMgBUsNBCABIARBCGogBEEYahAROgABIAFBAmohA0EDIQIgBEEYahAEQQNHDQALIARBEGoLIQUgAyAFIARBGGoQEToAACABIAJqIABrIQIMAgsgAyAEQRBqIARBGGoQEToAAiADIARBCGogBEEYahAROgADIANBBGohAwwAAAsACyAEQTBqJAAgAgtpAQF/An8CQAJAIAJBB00NACABKAAAQbfIwuF+Rw0AIAAgASgABDYCmOIBQWIgAEEQaiABIAIQPiIDEAMNAhogAEKBgICAEDcDiOEBIAAgASADaiACIANrECoMAQsgACABIAIQKgtBAAsLrQMBBn8jAEGAAWsiAyQAQWIhCAJAIAJBCUkNACAAQZjQAGogAUEIaiIEIAJBeGogAEGY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wOABCwutAgIEfwF+IwBBQGoiBCQAAkACQCACQQhJDQAgASgAAEFwcUHQ1LTCAUcNACABIAIQIiEBIABCADcDCCAAQQA2AgQgACABNgIADAELIARBGGogASACEC0iAxADBEAgACADEBoMAQsgAwRAIABBuH8QGgwBCyACIAQoAjAiA2shAiABIANqIQMDQAJAIAAgAyACIARBCGoQLCIFEAMEfyAFBSACIAVBA2oiBU8NAUG4fwsQGgwCCyAGQQFqIQYgAiAFayECIAMgBWohAyAEKAIMRQ0ACyAEKAI4BEAgAkEDTQRAIABBuH8QGgwCCyADQQRqIQMLIAQoAighAiAEKQMYIQcgAEEANgIEIAAgAyABazYCACAAIAIgBmytIAcgB0J/URs3AwgLIARBQGskAAslAQF/IwBBEGsiAiQAIAIgACABEFEgAigCACEAIAJBEGokACAAC30BBH8jAEGQBGsiBCQAIARB/wE2AggCQCAEQRBqIARBCGogBEEMaiABIAIQFSIGEAMEQCAGIQUMAQtBVCEFIAQoAgwiB0EGSw0AIAMgBEEQaiAEKAIIIAcQQSIFEAMNACAAIAEgBmogAiAGayADEDwhBQsgBEGQBGokACAFC4cBAgJ/An5BABAWIQMCQANAIAEgA08EQAJAIAAoAABBcHFB0NS0wgFGBEAgACABECIiAhADRQ0BQn4PCyAAIAEQVSIEQn1WDQMgBCAFfCIFIARUIQJCfiEEIAINAyAAIAEQUiICEAMNAwsgASACayEBIAAgAmohAAwBCwtCfiAFIAEbIQQLIAQLPwIBfwF+IwBBMGsiAiQAAn5CfiACQQhqIAAgARAtDQAaQgAgAigCHEEBRg0AGiACKQMICyEDIAJBMGokACADC40BAQJ/IwBBMGsiASQAAkAgAEUNACAAKAKI4gENACABIABB/OEBaigCADYCKCABIAApAvThATcDICAAEDAgACgCqOIBIQIgASABKAIoNgIYIAEgASkDIDcDECACIAFBEGoQGyAAQQA2AqjiASABIAEoAig2AgggASABKQMgNwMAIAAgARAbCyABQTBqJAALKgECfyMAQRBrIgAkACAAQQA2AgggAEIANwMAIAAQWCEBIABBEGokACABC4cBAQN/IwBBEGsiAiQAAkAgACgCAEUgACgCBEVzDQAgAiAAKAIINgIIIAIgACkCADcDAAJ/IAIoAgAiAQRAIAIoAghBqOMJIAERBQAMAQtBqOMJECgLIgFFDQAgASAAKQIANwL04QEgAUH84QFqIAAoAgg2AgAgARBZIAEhAwsgAkEQaiQAIAMLywEBAn8jAEEgayIBJAAgAEGBgIDAADYCtOIBIABBADYCiOIBIABBADYC7OEBIABCADcDkOIBIABBADYCpOMJIABBADYC3OIBIABCADcCzOIBIABBADYCvOIBIABBADYCxOABIABCADcCnOIBIABBpOIBakIANwIAIABBrOIBakEANgIAIAFCADcCECABQgA3AhggASABKQMYNwMIIAEgASkDEDcDACABKAIIQQh2QQFxIQIgAEEANgLg4gEgACACNgKM4gEgAUEgaiQAC3YBA38jAEEwayIBJAAgAARAIAEgAEHE0AFqIgIoAgA2AiggASAAKQK80AE3AyAgACgCACEDIAEgAigCADYCGCABIAApArzQATcDECADIAFBEGoQGyABIAEoAig2AgggASABKQMgNwMAIAAgARAbCyABQTBqJAALzAEBAX8gACABKAK00AE2ApjiASAAIAEoAgQiAjYCwOABIAAgAjYCvOABIAAgAiABKAIIaiICNgK44AEgACACNgLE4AEgASgCuNABBEAgAEKBgICAEDcDiOEBIAAgAUGk0ABqNgIMIAAgAUGUIGo2AgggACABQZwwajYCBCAAIAFBDGo2AgAgAEGs0AFqIAFBqNABaigCADYCACAAQbDQAWogAUGs0AFqKAIANgIAIABBtNABaiABQbDQAWooAgA2AgAPCyAAQgA3A4jhAQs7ACACRQRAQbp/DwsgBEUEQEFsDwsgAiAEEGAEQCAAIAEgAiADIAQgBRBhDwsgACABIAIgAyAEIAUQZQtGAQF/IwBBEGsiBSQAIAVBCGogBBAOAn8gBS0ACQRAIAAgASACIAMgBBAyDAELIAAgASACIAMgBBA0CyEAIAVBEGokACAACzQAIAAgAyAEIAUQNiIFEAMEQCAFDwsgBSAESQR/IAEgAiADIAVqIAQgBWsgABA1BUG4fwsLRgEBfyMAQRBrIgUkACAFQQhqIAQQDgJ/IAUtAAkEQCAAIAEgAiADIAQQYgwBCyAAIAEgAiADIAQQNQshACAFQRBqJAAgAAtZAQF/QQ8hAiABIABJBEAgAUEE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", Un = "display-p3", Wn = "display-p3-linear", Gn = /* @__PURE__ */ new WeakMap(), Kn = 0, qn, q = class e extends ce {
	constructor(e) {
		super(e), this.transcoderPath = "", this.transcoderBinary = null, this.transcoderPending = null, this.workerPool = new Mn(), this.workerSourceURL = "", this.workerConfig = null, typeof MSC_TRANSCODER < "u" && console.warn("THREE.KTX2Loader: Please update to latest \"basis_transcoder\". \"msc_basis_transcoder\" is no longer supported in three.js r125+.");
	}
	setTranscoderPath(e) {
		return this.transcoderPath = e, this;
	}
	setWorkerLimit(e) {
		return this.workerPool.setWorkerLimit(e), this;
	}
	async detectSupportAsync(e) {
		return this.workerConfig = {
			astcSupported: await e.hasFeatureAsync("texture-compression-astc"),
			astcHDRSupported: !1,
			etc1Supported: await e.hasFeatureAsync("texture-compression-etc1"),
			etc2Supported: await e.hasFeatureAsync("texture-compression-etc2"),
			dxtSupported: await e.hasFeatureAsync("texture-compression-bc"),
			bptcSupported: await e.hasFeatureAsync("texture-compression-bptc"),
			pvrtcSupported: await e.hasFeatureAsync("texture-compression-pvrtc")
		}, this;
	}
	detectSupport(e) {
		return e.isWebGPURenderer === !0 ? this.workerConfig = {
			astcSupported: e.hasFeature("texture-compression-astc"),
			astcHDRSupported: !1,
			etc1Supported: e.hasFeature("texture-compression-etc1"),
			etc2Supported: e.hasFeature("texture-compression-etc2"),
			dxtSupported: e.hasFeature("texture-compression-bc"),
			bptcSupported: e.hasFeature("texture-compression-bptc"),
			pvrtcSupported: e.hasFeature("texture-compression-pvrtc")
		} : this.workerConfig = {
			astcSupported: e.extensions.has("WEBGL_compressed_texture_astc"),
			astcHDRSupported: e.extensions.has("WEBGL_compressed_texture_astc") && e.extensions.get("WEBGL_compressed_texture_astc").getSupportedProfiles().includes("hdr"),
			etc1Supported: e.extensions.has("WEBGL_compressed_texture_etc1"),
			etc2Supported: e.extensions.has("WEBGL_compressed_texture_etc"),
			dxtSupported: e.extensions.has("WEBGL_compressed_texture_s3tc"),
			bptcSupported: e.extensions.has("EXT_texture_compression_bptc"),
			pvrtcSupported: e.extensions.has("WEBGL_compressed_texture_pvrtc") || e.extensions.has("WEBKIT_WEBGL_compressed_texture_pvrtc")
		}, this;
	}
	init() {
		if (!this.transcoderPending) {
			let t = new ie(this.manager);
			t.setPath(this.transcoderPath), t.setWithCredentials(this.withCredentials);
			let n = t.loadAsync("basis_transcoder.js"), r = new ie(this.manager);
			r.setPath(this.transcoderPath), r.setResponseType("arraybuffer"), r.setWithCredentials(this.withCredentials);
			let i = r.loadAsync("basis_transcoder.wasm");
			this.transcoderPending = Promise.all([n, i]).then(([t, n]) => {
				let r = e.BasisWorker.toString(), i = [
					"/* constants */",
					"let _EngineFormat = " + JSON.stringify(e.EngineFormat),
					"let _EngineType = " + JSON.stringify(e.EngineType),
					"let _TranscoderFormat = " + JSON.stringify(e.TranscoderFormat),
					"let _BasisFormat = " + JSON.stringify(e.BasisFormat),
					"/* basis_transcoder.js */",
					t,
					"/* worker */",
					r.substring(r.indexOf("{") + 1, r.lastIndexOf("}"))
				].join("\n");
				this.workerSourceURL = URL.createObjectURL(new Blob([i])), this.transcoderBinary = n, this.workerPool.setWorkerCreator(() => {
					let e = new Worker(this.workerSourceURL), t = this.transcoderBinary.slice(0);
					return e.postMessage({
						type: "init",
						config: this.workerConfig,
						transcoderBinary: t
					}, [t]), e;
				});
			}), Kn > 0 && console.warn("THREE.KTX2Loader: Multiple active KTX2 loaders may cause performance issues. Use a single KTX2Loader instance, or call .dispose() on old instances."), Kn++;
		}
		return this.transcoderPending;
	}
	load(e, t, n, r) {
		if (this.workerConfig === null) throw Error("THREE.KTX2Loader: Missing initialization with `.detectSupport( renderer )`.");
		let i = new ie(this.manager);
		i.setPath(this.path), i.setCrossOrigin(this.crossOrigin), i.setWithCredentials(this.withCredentials), i.setResponseType("arraybuffer"), i.load(e, (e) => {
			this.parse(e, t, r);
		}, n, r);
	}
	parse(e, t, n) {
		if (this.workerConfig === null) throw Error("THREE.KTX2Loader: Missing initialization with `.detectSupport( renderer )`.");
		if (Gn.has(e)) return Gn.get(e).promise.then(t).catch(n);
		this._createTexture(e).then((e) => t ? t(e) : null).catch(n);
	}
	_createTextureFrom(e, t) {
		let { type: n, error: r, data: { faces: i, width: a, height: o, format: s, type: c, dfdFlags: l } } = e;
		if (n === "error") return Promise.reject(r);
		let u;
		if (t.faceCount === 6) u = new ee(i, s, c);
		else {
			let e = i[0].mipmaps;
			u = t.layerCount > 1 ? new b(e, a, o, t.layerCount, s, c) : new te(e, a, o, s, c);
		}
		return u.minFilter = i[0].mipmaps.length === 1 ? ae : oe, u.magFilter = ae, u.generateMipmaps = !1, u.needsUpdate = !0, u.colorSpace = Qn(t), u.premultiplyAlpha = !!(l & 1), u;
	}
	async _createTexture(e, t = {}) {
		let n = Ln(new Uint8Array(e)), r = n.vkFormat === 1000066e3 && n.dataFormatDescriptor[0].colorModel === 167;
		if (!(n.vkFormat === 0 || r && !this.workerConfig.astcHDRSupported)) return Zn(n);
		let i = t, a = this.init().then(() => this.workerPool.postMessage({
			type: "transcode",
			buffer: e,
			taskConfig: i
		}, [e])).then((e) => this._createTextureFrom(e.data, n));
		return Gn.set(e, { promise: a }), a;
	}
	dispose() {
		this.workerPool.dispose(), this.workerSourceURL && URL.revokeObjectURL(this.workerSourceURL), Kn--;
	}
};
q.BasisFormat = {
	ETC1S: 0,
	UASTC: 1,
	UASTC_HDR: 2
}, q.TranscoderFormat = {
	ETC1: 0,
	ETC2: 1,
	BC1: 2,
	BC3: 3,
	BC4: 4,
	BC5: 5,
	BC7_M6_OPAQUE_ONLY: 6,
	BC7_M5: 7,
	PVRTC1_4_RGB: 8,
	PVRTC1_4_RGBA: 9,
	ASTC_4x4: 10,
	ATC_RGB: 11,
	ATC_RGBA_INTERPOLATED_ALPHA: 12,
	RGBA32: 13,
	RGB565: 14,
	BGR565: 15,
	RGBA4444: 16,
	BC6H: 22,
	RGB_HALF: 24,
	RGBA_HALF: 25
}, q.EngineFormat = {
	RGBAFormat: C,
	RGBA_ASTC_4x4_Format: ue,
	RGB_BPTC_UNSIGNED_Format: ve,
	RGBA_BPTC_Format: fe,
	RGBA_ETC2_EAC_Format: pe,
	RGBA_PVRTC_4BPPV1_Format: me,
	RGBA_S3TC_DXT5_Format: _e,
	RGB_ETC1_Format: ye,
	RGB_ETC2_Format: be,
	RGB_PVRTC_4BPPV1_Format: xe,
	RGBA_S3TC_DXT1_Format: he
}, q.EngineType = {
	UnsignedByteType: w,
	HalfFloatType: S,
	FloatType: x
}, q.BasisWorker = function() {
	let e, t, n, r = _EngineFormat, i = _EngineType, a = _TranscoderFormat, o = _BasisFormat;
	self.addEventListener("message", function(n) {
		let r = n.data;
		switch (r.type) {
			case "init":
				e = r.config, s(r.transcoderBinary);
				break;
			case "transcode":
				t.then(() => {
					try {
						let { faces: e, buffers: t, width: n, height: i, hasAlpha: a, format: o, type: s, dfdFlags: l } = c(r.buffer);
						self.postMessage({
							type: "transcode",
							id: r.id,
							data: {
								faces: e,
								width: n,
								height: i,
								hasAlpha: a,
								format: o,
								type: s,
								dfdFlags: l
							}
						}, t);
					} catch (e) {
						console.error(e), self.postMessage({
							type: "error",
							id: r.id,
							error: e.message
						});
					}
				});
				break;
		}
	});
	function s(e) {
		t = new Promise((t) => {
			n = {
				wasmBinary: e,
				onRuntimeInitialized: t
			}, BASIS(n);
		}).then(() => {
			n.initializeBasis(), n.KTX2File === void 0 && console.warn("THREE.KTX2Loader: Please update Basis Universal transcoder.");
		});
	}
	function c(e) {
		let t = new n.KTX2File(new Uint8Array(e));
		function r() {
			t.close(), t.delete();
		}
		if (!t.isValid()) throw r(), Error("THREE.KTX2Loader:	Invalid or unsupported .ktx2 file");
		let a;
		if (t.isUASTC()) a = o.UASTC;
		else if (t.isETC1S()) a = o.ETC1S;
		else if (t.isHDR()) a = o.UASTC_HDR;
		else throw Error("THREE.KTX2Loader: Unknown Basis encoding");
		let s = t.getWidth(), c = t.getHeight(), l = t.getLayers() || 1, u = t.getLevels(), f = t.getFaces(), m = t.getHasAlpha(), h = t.getDFDFlags(), { transcoderFormat: g, engineFormat: _, engineType: v } = d(a, s, c, m);
		if (!s || !c || !u) throw r(), Error("THREE.KTX2Loader:	Invalid texture");
		if (!t.startTranscoding()) throw r(), Error("THREE.KTX2Loader: .startTranscoding failed");
		let y = [], b = [];
		for (let e = 0; e < f; e++) {
			let n = [];
			for (let a = 0; a < u; a++) {
				let o = [], s, c;
				for (let n = 0; n < l; n++) {
					let l = t.getImageLevelInfo(a, n, e);
					e === 0 && a === 0 && n === 0 && (l.origWidth % 4 != 0 || l.origHeight % 4 != 0) && console.warn("THREE.KTX2Loader: ETC1S and UASTC textures should use multiple-of-four dimensions."), u > 1 ? (s = l.origWidth, c = l.origHeight) : (s = l.width, c = l.height);
					let d = new Uint8Array(t.getImageTranscodedSizeInBytes(a, n, 0, g)), f = t.transcodeImage(d, a, n, e, g, 0, -1, -1);
					if (v === i.HalfFloatType && (d = new Uint16Array(d.buffer, d.byteOffset, d.byteLength / Uint16Array.BYTES_PER_ELEMENT)), !f) throw r(), Error("THREE.KTX2Loader: .transcodeImage failed.");
					o.push(d);
				}
				let d = p(o);
				n.push({
					data: d,
					width: s,
					height: c
				}), b.push(d.buffer);
			}
			y.push({
				mipmaps: n,
				width: s,
				height: c,
				format: _,
				type: v
			});
		}
		return r(), {
			faces: y,
			buffers: b,
			width: s,
			height: c,
			hasAlpha: m,
			dfdFlags: h,
			format: _,
			type: v
		};
	}
	let l = [
		{
			if: "astcSupported",
			basisFormat: [o.UASTC],
			transcoderFormat: [a.ASTC_4x4, a.ASTC_4x4],
			engineFormat: [r.RGBA_ASTC_4x4_Format, r.RGBA_ASTC_4x4_Format],
			engineType: [i.UnsignedByteType],
			priorityETC1S: Infinity,
			priorityUASTC: 1,
			needsPowerOfTwo: !1
		},
		{
			if: "bptcSupported",
			basisFormat: [o.ETC1S, o.UASTC],
			transcoderFormat: [a.BC7_M5, a.BC7_M5],
			engineFormat: [r.RGBA_BPTC_Format, r.RGBA_BPTC_Format],
			engineType: [i.UnsignedByteType],
			priorityETC1S: 3,
			priorityUASTC: 2,
			needsPowerOfTwo: !1
		},
		{
			if: "dxtSupported",
			basisFormat: [o.ETC1S, o.UASTC],
			transcoderFormat: [a.BC1, a.BC3],
			engineFormat: [r.RGBA_S3TC_DXT1_Format, r.RGBA_S3TC_DXT5_Format],
			engineType: [i.UnsignedByteType],
			priorityETC1S: 4,
			priorityUASTC: 5,
			needsPowerOfTwo: !1
		},
		{
			if: "etc2Supported",
			basisFormat: [o.ETC1S, o.UASTC],
			transcoderFormat: [a.ETC1, a.ETC2],
			engineFormat: [r.RGB_ETC2_Format, r.RGBA_ETC2_EAC_Format],
			engineType: [i.UnsignedByteType],
			priorityETC1S: 1,
			priorityUASTC: 3,
			needsPowerOfTwo: !1
		},
		{
			if: "etc1Supported",
			basisFormat: [o.ETC1S, o.UASTC],
			transcoderFormat: [a.ETC1],
			engineFormat: [r.RGB_ETC1_Format],
			engineType: [i.UnsignedByteType],
			priorityETC1S: 2,
			priorityUASTC: 4,
			needsPowerOfTwo: !1
		},
		{
			if: "pvrtcSupported",
			basisFormat: [o.ETC1S, o.UASTC],
			transcoderFormat: [a.PVRTC1_4_RGB, a.PVRTC1_4_RGBA],
			engineFormat: [r.RGB_PVRTC_4BPPV1_Format, r.RGBA_PVRTC_4BPPV1_Format],
			engineType: [i.UnsignedByteType],
			priorityETC1S: 5,
			priorityUASTC: 6,
			needsPowerOfTwo: !0
		},
		{
			if: "bptcSupported",
			basisFormat: [o.UASTC_HDR],
			transcoderFormat: [a.BC6H],
			engineFormat: [r.RGB_BPTC_UNSIGNED_Format],
			engineType: [i.HalfFloatType],
			priorityHDR: 1,
			needsPowerOfTwo: !1
		},
		{
			basisFormat: [o.ETC1S, o.UASTC],
			transcoderFormat: [a.RGBA32, a.RGBA32],
			engineFormat: [r.RGBAFormat, r.RGBAFormat],
			engineType: [i.UnsignedByteType, i.UnsignedByteType],
			priorityETC1S: 100,
			priorityUASTC: 100,
			needsPowerOfTwo: !1
		},
		{
			basisFormat: [o.UASTC_HDR],
			transcoderFormat: [a.RGBA_HALF],
			engineFormat: [r.RGBAFormat],
			engineType: [i.HalfFloatType],
			priorityHDR: 100,
			needsPowerOfTwo: !1
		}
	], u = {
		[o.ETC1S]: l.filter((e) => e.basisFormat.includes(o.ETC1S)).sort((e, t) => e.priorityUASTC - t.priorityUASTC),
		[o.UASTC]: l.filter((e) => e.basisFormat.includes(o.UASTC)).sort((e, t) => e.priorityUASTC - t.priorityUASTC),
		[o.UASTC_HDR]: l.filter((e) => e.basisFormat.includes(o.UASTC_HDR)).sort((e, t) => e.priorityHDR - t.priorityHDR)
	};
	function d(t, n, r, i) {
		let a = u[t];
		for (let o = 0; o < a.length; o++) {
			let s = a[o];
			if (!(s.if && !e[s.if]) && s.basisFormat.includes(t) && !(i && s.transcoderFormat.length < 2) && !(s.needsPowerOfTwo && !(f(n) && f(r)))) return {
				transcoderFormat: s.transcoderFormat[+!!i],
				engineFormat: s.engineFormat[+!!i],
				engineType: s.engineType[0]
			};
		}
		throw Error("THREE.KTX2Loader: Failed to identify transcoding target.");
	}
	function f(e) {
		return e <= 2 || (e & e - 1) == 0 && e !== 0;
	}
	function p(e) {
		if (e.length === 1) return e[0];
		let t = 0;
		for (let n = 0; n < e.length; n++) {
			let r = e[n];
			t += r.byteLength;
		}
		let n = new Uint8Array(t), r = 0;
		for (let t = 0; t < e.length; t++) {
			let i = e[t];
			n.set(i, r), r += i.byteLength;
		}
		return n;
	}
};
var Jn = /* @__PURE__ */ new Set([
	C,
	Ce,
	we
]), Yn = {
	109: C,
	97: C,
	37: C,
	43: C,
	103: Ce,
	83: Ce,
	16: Ce,
	22: Ce,
	100: we,
	76: we,
	15: we,
	9: we,
	148: be,
	152: pe,
	[Nn]: ue,
	158: ue,
	157: ue,
	166: de,
	165: de,
	133: he,
	134: he,
	131: Se,
	132: Se,
	138: ge,
	137: ge,
	142: _e,
	141: _e,
	146: fe,
	145: fe
}, Xn = {
	109: x,
	97: S,
	37: w,
	43: w,
	103: x,
	83: S,
	16: w,
	22: w,
	100: x,
	76: S,
	15: w,
	9: w,
	148: w,
	152: w,
	[Nn]: S,
	166: w,
	165: w
};
async function Zn(e) {
	let { vkFormat: t } = e;
	if (Yn[t] === void 0) throw Error("THREE.KTX2Loader: Unsupported vkFormat.");
	let n;
	e.supercompressionScheme === 2 && (qn ||= new Promise(async (e) => {
		let t = new Vn();
		await t.init(), e(t);
	}), n = await qn);
	let r = [];
	for (let i = 0; i < e.levels.length; i++) {
		let a = Math.max(1, e.pixelWidth >> i), o = Math.max(1, e.pixelHeight >> i), s = e.pixelDepth ? Math.max(1, e.pixelDepth >> i) : 0, c = e.levels[i], l;
		if (e.supercompressionScheme === 0) l = c.levelData;
		else if (e.supercompressionScheme === 2) l = n.decode(c.levelData, c.uncompressedByteLength);
		else throw Error("THREE.KTX2Loader: Unsupported supercompressionScheme.");
		let u;
		u = Xn[t] === x ? new Float32Array(l.buffer, l.byteOffset, l.byteLength / Float32Array.BYTES_PER_ELEMENT) : Xn[t] === S ? new Uint16Array(l.buffer, l.byteOffset, l.byteLength / Uint16Array.BYTES_PER_ELEMENT) : l, r.push({
			data: u,
			width: a,
			height: o,
			depth: s
		});
	}
	let i;
	if (Jn.has(Yn[t])) i = e.pixelDepth === 0 ? new re(r[0].data, e.pixelWidth, e.pixelHeight) : new ne(r[0].data, e.pixelWidth, e.pixelHeight, e.pixelDepth);
	else {
		if (e.pixelDepth > 0) throw Error("THREE.KTX2Loader: Unsupported pixelDepth.");
		i = new te(r, e.pixelWidth, e.pixelHeight), i.minFilter = r.length === 1 ? ae : oe, i.magFilter = ae;
	}
	return i.mipmaps = r, i.type = Xn[t], i.format = Yn[t], i.colorSpace = Qn(e), i.needsUpdate = !0, Promise.resolve(i);
}
function Qn(e) {
	let t = e.dataFormatDescriptor[0];
	return t.colorPrimaries === 1 ? t.transferFunction === 2 ? Te : se : t.colorPrimaries === 10 ? t.transferFunction === 2 ? Un : Wn : (t.colorPrimaries === 0 || console.warn(`THREE.KTX2Loader: Unsupported color primaries, "${t.colorPrimaries}"`), le);
}
//#endregion
//#region src/engine/runtimeTextureLoader.ts
var $n = class {
	imageLoader = new y.TextureLoader();
	ktx2Loader;
	constructor(e, t = "/basis/") {
		this.ktx2Loader = new q().setTranscoderPath(t).detectSupport(e);
	}
	loadAsync(e) {
		return /\.ktx2(?:[?#]|$)/i.test(e) ? this.ktx2Loader.loadAsync(e) : this.imageLoader.loadAsync(e);
	}
	dispose() {
		this.ktx2Loader.dispose();
	}
}, er = {
	maxOutputSize: 1024,
	enabled: !1
};
function tr(e, t, n) {
	let r = Math.max(1, Number.isFinite(e) ? e : 1), i = Math.max(1, Number.isFinite(t) ? t : 1);
	return Math.min(Math.max(.1, Number.isFinite(n) ? n : 1), 2, er.maxOutputSize / Math.max(r, i));
}
//#endregion
//#region src/engine/Haruki3DEngine.ts
var nr = 1, rr = new y.Vector3(Ee.x, Ee.y, Ee.z), ir = new y.Vector3(De.x, De.y, De.z).normalize(), J = new y.Vector3(0, 1, 0), ar = !0, or = 0, sr = 1e-5, cr = g("up");
function lr(e) {
	return e && typeof e == "object" ? e : {};
}
function Y(e) {
	return Array.isArray(e) ? e.length : 0;
}
function ur(e) {
	let t = lr(e);
	return {
		managers: Y(t.managers ?? t.Managers),
		bones: Y(t.bones ?? t.Bones),
		extraBones: Y(t.extraBones ?? t.ExtraBones),
		sphereColliders: Y(t.sphereColliders ?? t.SphereColliders),
		capsuleColliders: Y(t.capsuleColliders ?? t.CapsuleColliders),
		panelColliders: Y(t.panelColliders ?? t.PanelColliders),
		characterHairPresent: !!(t.characterHair ?? t.CharacterHair),
		characterEyePresent: !!(t.characterEye ?? t.CharacterEye)
	};
}
function dr(e, t, n) {
	let r = lr(e), i = lr(r.pjskSpringBone ?? r.PjskSpringBone), a = lr(i.raw ?? i.Raw), o = ur(a.body ?? a.Body), s = ur(a.head ?? a.Head), c = !!(a.body ?? a.Body ?? a.head ?? a.Head);
	return {
		present: c,
		runtimePresent: !!n,
		active: !!n?.enabled,
		bodyManagerCount: o.managers,
		bodySpringBoneCount: o.bones,
		bodyExtraBoneCount: o.extraBones,
		bodySphereColliderCount: o.sphereColliders,
		bodyCapsuleColliderCount: o.capsuleColliders,
		bodyPanelColliderCount: o.panelColliders,
		headManagerCount: s.managers,
		headSpringBoneCount: s.bones,
		headExtraBoneCount: s.extraBones,
		headSphereColliderCount: s.sphereColliders,
		headCapsuleColliderCount: s.capsuleColliders,
		headPanelColliderCount: s.panelColliders,
		characterHairPresent: s.characterHairPresent,
		characterEyePresent: s.characterEyePresent,
		vrmSpringBoneManagerPresent: t,
		utjRuntime: n,
		source: c ? "PJSK_sekai_runtime" : "none"
	};
}
function fr(e, t, n = /* @__PURE__ */ new Set()) {
	if (!(!e || typeof e != "object" || n.has(e))) {
		if (n.add(e), e instanceof y.Texture) {
			t.add(e);
			return;
		}
		if (!(e instanceof y.Color || e instanceof y.Vector2 || e instanceof y.Vector3 || e instanceof y.Vector4 || e instanceof y.Matrix3 || e instanceof y.Matrix4 || ArrayBuffer.isView(e) || e instanceof ArrayBuffer)) {
			if (Array.isArray(e)) {
				for (let r of e) fr(r, t, n);
				return;
			}
			for (let r of Object.values(e)) fr(r, t, n);
		}
	}
}
function pr(e, t = !0, n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set()) {
	let i = Array.isArray(e) ? e : [e];
	for (let e of i) if (!n.has(e)) {
		if (t) {
			let t = /* @__PURE__ */ new Set();
			fr(e, t);
			for (let e of t) r.has(e) || (e.dispose(), r.add(e));
		}
		e.dispose();
	}
}
function mr(e, t = /* @__PURE__ */ new Set()) {
	let n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set();
	e.traverse((e) => {
		let i = e;
		i.isMesh && (i.geometry && !i.userData.pjskOutlineShell && !n.has(i.geometry) && (i.geometry.dispose(), n.add(i.geometry)), i.material && pr(i.material, !0, t, r));
	});
}
function hr(e, t = /* @__PURE__ */ new Set()) {
	for (let n of [...e.children]) mr(n, t), e.remove(n);
}
function gr(e) {
	let t = e.getAttribute("color");
	if (!t) return null;
	let n = 0;
	for (let e = 0; e < t.count; e += 1) if (n = Math.max(n, t.getX(e)), n > .01) return n;
	return n;
}
function _r(e) {
	return e === "eye" || e === "eyelight";
}
function vr(e) {
	let t = /* @__PURE__ */ new Set();
	typeof e.userData.pjskMaterialKind == "string" && t.add(e.userData.pjskMaterialKind);
	let n = Array.isArray(e.material) ? e.material : [e.material];
	for (let e of n) typeof e?.userData.pjskMaterialKind == "string" && t.add(e.userData.pjskMaterialKind);
	let r = n.map((e) => e.name.toLowerCase()), i = e.name.toLowerCase();
	return (Ht(e.name) === "acc" || i.includes("/acc") || r.some((e) => e.includes("_acc") || e.startsWith("mtl_acc"))) && t.add("accessory"), [...t];
}
function yr(e) {
	return e.find((e) => !_r(e)) ?? e[0] ?? null;
}
function br(e) {
	return e.length > 0 && e.every(_r);
}
function xr(e) {
	if (e instanceof y.ShaderMaterial) {
		let t = e.uniforms.uMainTex?.value;
		if (t instanceof y.Texture) return t;
	}
	return e.map ?? null;
}
function X(e, t, n, r = 0, i = 1) {
	let a = Math.hypot(t, n);
	return a <= sr ? e.set(r, i) : e.set(t / a, n / a);
}
function Sr(e, t) {
	let n = Math.abs(t - e);
	return y.MathUtils.clamp(1 - Math.abs(n - 180) / 180, 0, 1);
}
function Z(e) {
	return e && typeof e == "object" ? e : {};
}
function Q(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function Cr(e) {
	let t = Z(e), n = Q(t.r ?? t.R), r = Q(t.g ?? t.G), i = Q(t.b ?? t.B);
	return n === null || r === null || i === null ? null : `#${new y.Color(n, r, i).getHexString()}`;
}
function wr(e, t = !0) {
	let n = Z(e), r = Q(n.tileX ?? n.TileX), i = Q(n.tileY ?? n.TileY), a = Q(n.sample ?? n.Sample);
	return r && i && a !== null ? {
		tileX: r,
		tileY: i,
		sample: a,
		enabled: t
	} : null;
}
function Tr(e) {
	let t = Z(e), n = Z(t.characterControllers ?? t.CharacterControllers), r = Z(n.eye ?? n.Eye);
	return Object.keys(r).length ? {
		lightInfluence: Q(r.lightInfluence ?? r.LightInfluence),
		lightInfluenceForEyeHighlight: Q(r.lightInfluenceForEyeHighlight ?? r.LightInfluenceForEyeHighlight),
		tintColor: Cr(r.tintColor ?? r.TintColor),
		emissionColor: Cr(r.emissionColor ?? r.EmissionColor),
		baseTiling: wr(r.baseTiling ?? r.BaseTiling),
		highlightTiling: wr(r.highlightTiling ?? r.HighlightTiling)
	} : null;
}
function Er(e) {
	let t = Z(e), n = Z(t.pjskSpringBone ?? t.PjskSpringBone), r = Z(t.runtimeUnitySetup ?? t.RuntimeUnitySetup ?? n.runtimeUnitySetup ?? n.RuntimeUnitySetup), i = Z(t.funit ?? t.FUnit ?? n.funit ?? n.FUnit ?? r.funit ?? r.FUnit), a = i.detectedScripts ?? i.DetectedScripts, o = Array.isArray(a) ? a.filter((e) => typeof e == "string") : [], s = (e, t) => Math.max(Math.trunc(Q(i[e] ?? i[t]) ?? 0), 0);
	return {
		present: !!(i.present ?? i.Present),
		scriptCount: s("scriptCount", "ScriptCount"),
		springManagerCount: s("springManagerCount", "SpringManagerCount"),
		springBoneCount: s("springBoneCount", "SpringBoneCount"),
		sphereColliderCount: s("sphereColliderCount", "SphereColliderCount"),
		capsuleColliderCount: s("capsuleColliderCount", "CapsuleColliderCount"),
		panelColliderCount: s("panelColliderCount", "PanelColliderCount"),
		detectedScripts: o,
		policy: typeof (i.policy ?? i.Policy) == "string" ? String(i.policy ?? i.Policy) : "metadata_only; do not merge with UTJ/Sekai SpringBone runtime"
	};
}
function Dr(e) {
	let t = Z(e), n = Z(t.characterControllers ?? t.CharacterControllers), r = Z(n.hair ?? n.Hair);
	if (!Object.keys(r).length) return null;
	let i = Z(r.headTransform ?? r.HeadTransform);
	return {
		offset: v(_(r.offset ?? r.Offset, new y.Vector3())),
		headTransformName: typeof (i.name ?? i.Name) == "string" ? String(i.name ?? i.Name) : null,
		headTransformPath: typeof (i.transformPath ?? i.TransformPath) == "string" ? String(i.transformPath ?? i.TransformPath) : null
	};
}
function Or(e, t) {
	for (let n of t) {
		let t = e.get(n);
		if (t) return {
			node: t,
			path: n
		};
	}
	return null;
}
function $(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5))
	};
}
function kr(e) {
	let [t, ...n] = e.split(":"), r = Number(t);
	if (!Number.isInteger(r) || r <= 0) throw Error(`Invalid roleId ${e}: expected "<characterId>:<unit>".`);
	return {
		characterId: r,
		unit: n.length > 0 && n.join(":").trim() || null
	};
}
function Ar() {
	let e = /* @__PURE__ */ Error("Custom part selection was superseded by a newer request.");
	return e.name = "AbortError", e;
}
var jr = class {
	container;
	ownsCanvas;
	scene;
	camera;
	renderer;
	controls;
	cameraTarget = new y.Vector3();
	autoRender;
	manageResize;
	clock = new y.Clock();
	directionalLight;
	fillLight;
	previewLightBase;
	textureLoader;
	bodyMaterial;
	hairMaterial;
	faceMaterial;
	characterLighting;
	projectedShadow;
	characterRoot;
	bodySlot;
	headSlot;
	sceneReference = new y.Group();
	capturePresentationEnabled = null;
	captureBackgroundTexture = null;
	viewportWidth = 0;
	viewportHeight = 0;
	viewportPixelRatio = 0;
	animationFrame = 0;
	importRevision = 0;
	customSelectionQueue = Promise.resolve();
	customSelectionGeneration = 0;
	currentBodyAsset = null;
	currentHeadAsset = null;
	currentImportSnapshot = null;
	currentBodyAttachNode = null;
	currentHeadAttachOriginNode = null;
	currentCompositionStatus = {
		mode: "pending",
		missingBodyBones: [],
		missingHeadBones: []
	};
	currentBodyAnimationRoot = null;
	faceMotion = new Nt();
	animationPlayback;
	currentRuntimeExtension = null;
	currentSpringRuntime = null;
	currentExtraBoneRuntime = null;
	currentConstraintRuntime = null;
	currentSpringTimelineControl = null;
	currentPrefabSourceGraph = null;
	currentPrefabHeadFollowDebug = {
		active: !1,
		sourcePath: null,
		targetPath: null,
		reason: null
	};
	springRuntimeMode = "unity-prefab";
	masterCharacterHeightMeters = 1.6;
	characterModelScaleMeters = 1.6;
	tempMatrixA = new y.Matrix4();
	tempMatrixB = new y.Matrix4();
	tempVector = new y.Vector3();
	tempVectorB = new y.Vector3();
	tempQuaternion = new y.Quaternion();
	tempScale = new y.Vector3();
	faceRightWorld = new y.Vector3();
	faceUpWorld = new y.Vector3();
	faceForwardWorld = new y.Vector3();
	headTransformUpWorld = new y.Vector3();
	faceHeadWorldPosition = new y.Vector3();
	faceShadowHeadHorizontal = new y.Vector2();
	faceShadowLightHorizontal = new y.Vector2();
	headDotDirectionalLight = new y.Vector2();
	hairHeadPosition = new y.Vector3();
	currentHairOffset = new y.Vector3();
	currentHairHeadTransform = null;
	currentCameraPreset = "default";
	currentCameraProfile = null;
	cameraRootYawDegrees = 0;
	cameraDebugChangeCallback = null;
	currentLoadedRuntimePackage = null;
	lastNativeMeshInstallDiagnostics = null;
	lastConstraintSetupDiagnostics = null;
	runtimeDebug = {
		materialBindingMode: "manifest",
		hairShadowMode: "sekai_head_position",
		hairShadowOffset: $(this.currentHairOffset),
		hairShadowWorldPosition: $(this.hairHeadPosition),
		funit: Er(null),
		body: [],
		head: [],
		headMaterialSlots: [],
		headMorphs: [],
		outlineShells: []
	};
	constructor(e, t) {
		let n = e instanceof HTMLElement ? {
			container: e,
			initialLight: t
		} : e;
		if (!n.initialLight) throw Error("Missing initial light state for Haruki 3D engine.");
		let r = n.initialLight;
		if (this.previewLightBase = { ...r }, !n.container && !n.canvas) throw Error("Haruki 3D engine requires a container or canvas.");
		this.animationPlayback = new m({ onLoopPromoted: () => this.faceMotion.promoteLoop() }), this.container = n.container ?? null, this.ownsCanvas = n.canvas === void 0, this.autoRender = n.autoRender ?? !0, this.manageResize = n.manageResize ?? n.canvas === void 0, this.scene = new y.Scene(), this.scene.background = new y.Color("#7f8d95"), this.scene.fog = new y.Fog("#7f8d95", 5.5, 15);
		let i = n.canvas ?? n.container, a = this.ownsCanvas ? 320 : 1, o = Math.max(i.clientWidth, a), s = Math.max(i.clientHeight, a), c = ft(this.characterModelScaleMeters);
		this.camera = new y.PerspectiveCamera(c.fov, o / s, .1, 100), this.camera.position.copy(c.position), this.renderer = new y.WebGLRenderer({
			antialias: !1,
			stencil: !0,
			canvas: n.canvas
		}), this.renderer.autoClearStencil = !0;
		let l = tr(o, s, window.devicePixelRatio);
		this.renderer.setPixelRatio(l), this.renderer.setSize(o, s, this.ownsCanvas), this.viewportWidth = o, this.viewportHeight = s, this.viewportPixelRatio = l, this.renderer.outputColorSpace = y.SRGBColorSpace, this.container && this.renderer.domElement.parentElement !== this.container && this.container.appendChild(this.renderer.domElement), this.updateCaptureBackgroundTexture(), this.cameraTarget.copy(c.target), n.controlsFactory ? (this.controls = n.controlsFactory({
			camera: this.camera,
			canvas: this.renderer.domElement,
			target: this.cameraTarget,
			onChange: (e) => {
				this.cameraTarget.copy(e), this.cameraDebugChangeCallback?.();
			}
		}), this.controls.update()) : (this.controls = null, this.camera.lookAt(this.cameraTarget)), this.directionalLight = new y.DirectionalLight("#fffaf2", r.intensity), this.directionalLight.position.set(r.x, r.y, r.z), this.scene.add(this.directionalLight), this.fillLight = new y.AmbientLight("#fff8f0", r.ambient), this.scene.add(this.fillLight), this.textureLoader = new $n(this.renderer, n.ktx2TranscoderPath), this.bodyMaterial = Le({
			baseColor: "#f5d6d0",
			shadowColor: "#c79b95",
			lightDirection: this.directionalLight.position.clone(),
			lightIntensity: r.intensity,
			ambientIntensity: r.ambient,
			shadowThreshold: r.shadowThreshold,
			shadowWeight: r.shadowWeight,
			valueShadowInfluence: nr,
			characterAmbientIntensity: r.characterAmbient,
			rimColorAlpha: r.rimColorAlpha,
			controllerRimRange: r.rimRange,
			controllerRimEdgeSmoothness: r.rimEdgeSmoothness,
			controllerRimEmission: r.rimEmission,
			controllerRimLightInfluence: r.rimLightInfluence,
			controllerRimShadowSharpness: r.rimShadowSharpness,
			rimDirection: B()
		}), this.hairMaterial = Le({
			baseColor: "#7b5b4a",
			shadowColor: "#513d33",
			lightDirection: this.directionalLight.position.clone(),
			lightIntensity: r.intensity,
			ambientIntensity: r.ambient,
			shadowThreshold: r.shadowThreshold,
			shadowWeight: r.shadowWeight,
			valueShadowInfluence: nr,
			characterAmbientIntensity: r.characterAmbient,
			rimColorAlpha: r.rimColorAlpha,
			controllerRimRange: r.rimRange,
			controllerRimEdgeSmoothness: r.rimEdgeSmoothness,
			controllerRimEmission: r.rimEmission,
			controllerRimLightInfluence: r.rimLightInfluence,
			controllerRimShadowSharpness: r.rimShadowSharpness,
			rimDirection: B(),
			hairShadowEnabled: !1,
			useLambert: !0,
			headPosition: this.hairHeadPosition
		}), this.faceMaterial = Be({
			baseColor: "#ffe4dc",
			warmColor: "#ffd4c8",
			lightDirection: ir.clone(),
			lightIntensity: r.intensity,
			ambientIntensity: r.ambient,
			headDotDirectionalLight: this.headDotDirectionalLight,
			useFaceShadowLimiter: ar,
			faceShadowLimitRange: or,
			shadowThreshold: r.shadowThreshold,
			shadowWeight: r.shadowWeight,
			useLambert: !0
		}), this.characterRoot = new y.Group(), this.bodySlot = new y.Group(), this.headSlot = new y.Group(), this.characterRoot.add(this.bodySlot), this.characterRoot.add(this.headSlot), this.characterLighting = new jn({
			bodyMaterial: this.bodyMaterial,
			hairMaterial: this.hairMaterial,
			faceMaterial: this.faceMaterial,
			bodySlot: this.bodySlot,
			headSlot: this.headSlot,
			directionalLight: this.directionalLight,
			fillLight: this.fillLight,
			debug: this.runtimeDebug,
			valueShadowInfluence: nr
		}), this.scene.add(this.characterRoot), this.projectedShadow = new St(), this.scene.add(this.projectedShadow.group), this.setPresentationMode(n.presentationMode ?? "interactive"), this.applyCameraPreset(n.cameraPreset ?? "default", n.cameraProfile), this.handleResize = this.handleResize.bind(this), this.manageResize && (window.addEventListener("resize", this.handleResize), this.handleResize()), this.autoRender && this.render();
	}
	async importCombinedCharacter(e, t = {}) {
		let n = ++this.importRevision, r = t.preserveAnimation ? this.animationPlayback.capturePosition() : null;
		t.disposeBeforeLoad && this.releaseCurrentCharacterResources({
			preserveAnimationSelection: t.preserveAnimation ?? !1,
			clearAnimationCache: t.clearAnimationCache ?? !1
		}), this.runtimeDebug.outlineShells = [], this.lastNativeMeshInstallDiagnostics = null, this.currentBodyAsset = e.bodyAsset, this.currentHeadAsset = e.headAsset, this.characterLighting.setCharacterSkinColors(e.skinColors ?? null), this.lastConstraintSetupDiagnostics = null, this.applyCostumeShopCharacterHeight(e.bodyAsset.characterHeightMeters ?? this.masterCharacterHeightMeters);
		let a = await this.loadCombinedCharacterAsset(e);
		if (n !== this.importRevision) return {
			revision: n,
			body: this.makeImportStatus(e.bodyAsset, a),
			head: this.makeImportStatus(e.headAsset, a),
			composition: this.currentCompositionStatus
		};
		this.clearCharacterSlot(this.bodySlot), this.clearCharacterSlot(this.headSlot), this.resetSlotParents(), this.currentRuntimeExtension = e.runtimeExtension, this.currentSpringRuntime = null, this.currentExtraBoneRuntime = null, this.currentConstraintRuntime = null, this.currentBodyAttachNode = null, this.currentHeadAttachOriginNode = null, this.runtimeDebug.headMorphs = [], this.faceMotion.release({ preserveMotion: !0 }), this.currentBodyAnimationRoot = null, this.currentPrefabSourceGraph = null, this.currentHairHeadTransform = null, this.currentPrefabHeadFollowDebug = {
			active: !1,
			sourcePath: null,
			targetPath: null,
			reason: "not initialized"
		}, this.bodySlot.add(a.root), this.currentPrefabSourceGraph = a.prefabSourceGraph, i(a.prefabSourceGraph, this.characterModelScaleMeters), a.prefabSourceGraph.root !== a.root && this.bodySlot.add(a.prefabSourceGraph.root), this.currentBodyAnimationRoot = a.prefabSourceGraph.root, this.currentBodyAttachNode = a.prefabSourceGraph.bodyAttach, this.currentHeadAttachOriginNode = a.prefabSourceGraph.headOrigin, this.currentPrefabHeadFollowDebug = a.prefabSourceGraph.debug, this.runtimeDebug.headMorphs = this.faceMotion.bind(a.root, e.headAsset), this.prepareCombinedComposition(), this.currentConstraintRuntime = h(a.prefabSourceGraph, this.currentRuntimeExtension, this.characterModelScaleMeters), this.syncUnityPrefabSourceGraph(), this.currentExtraBoneRuntime = Ge.fromPjskRuntimeExtension(this.currentRuntimeExtension, a.prefabSourceGraph.root), this.currentSpringRuntime = this.createSpringRuntime(a.prefabSourceGraph.root), await Promise.all([this.reloadAnimationPlayback({ resetSpring: r === null }), this.renderer.compileAsync(this.scene, this.camera)]), r && (this.animationPlayback.restorePosition(r), this.faceMotion.applyCurrent(), this.syncOfficialModelCombineSetup(), this.currentExtraBoneRuntime?.update(), this.resetCurrentSpringRuntimeState());
		let o = {
			revision: n,
			body: {
				...this.makeImportStatus(e.bodyAsset, a),
				assetId: e.id,
				displayName: `${e.displayName} [combined body]`
			},
			head: {
				...this.makeImportStatus(e.headAsset, a),
				assetId: e.id,
				displayName: `${e.displayName} [combined head]`
			},
			composition: this.currentCompositionStatus
		};
		return this.currentImportSnapshot = o, this.characterLighting.applyCharacterView(), o;
	}
	setHairShadowMode(e) {
		this.characterLighting.setHairShadowMode(e);
	}
	setProjectedShadowSettings(e = {}) {
		this.projectedShadow.setSettings(e);
	}
	setFaceSdfDebugMode(e) {
		this.characterLighting.setFaceSdfDebugMode(e);
	}
	setFaceSdfEnabled(e) {
		this.characterLighting.setFaceSdfEnabled(e);
	}
	setBodyDebugMode(e) {
		this.characterLighting.setBodyDebugMode(e);
	}
	setToonShadowPreview(e, t) {
		this.characterLighting.setToonShadowPreview(e, t);
	}
	setFaceSdfDebugLightMode(e) {
		this.characterLighting.setFaceSdfDebugLightMode(e), this.updateShaderFaceBasis();
	}
	setRenderIsolationMode(e) {
		this.characterLighting.setRenderIsolationMode(e);
	}
	setCharacterYawDegrees(e) {
		let t = y.MathUtils.degToRad(Number.isFinite(e) ? e : 0);
		this.characterRoot.rotation.y = t, this.characterRoot.updateMatrixWorld(!0), this.syncOfficialModelCombineSetup(), this.characterRoot.updateMatrixWorld(!0), this.resetCurrentSpringRuntimeState(), this.updateShaderFaceBasis();
	}
	setViewYawDegrees(e) {
		if (this.cameraRootYawDegrees = Number.isFinite(e) ? e : 0, this.currentCameraPreset === "capture") {
			let e = pt(this.currentCameraProfile ?? "full-body", this.cameraRootYawDegrees);
			this.setCameraTarget(e.target), this.camera.position.copy(e.position), this.camera.fov = e.fov;
		} else {
			let e = ft(this.characterModelScaleMeters), t = e.position.clone().sub(e.target).applyAxisAngle(J, y.MathUtils.degToRad(this.cameraRootYawDegrees));
			this.setCameraTarget(e.target), this.camera.position.copy(e.target).add(t), this.camera.fov = e.fov;
		}
		this.camera.updateProjectionMatrix(), this.syncCameraTarget(), this.applyPreviewLightForCameraRoot(), this.updateShaderFaceBasis(), this.cameraDebugChangeCallback?.();
	}
	faceCharacterTowardCamera() {
		this.characterRoot.updateMatrixWorld(!0);
		let e = this.currentBodyAnimationRoot ?? this.characterRoot;
		e.updateMatrixWorld(!0);
		let t = Or(f(e), [
			"body/Position",
			"body/Position/PositionOffset",
			"body/Position/PositionOffset/Hip",
			"body/Position/Hip",
			"face/Position"
		])?.node ?? e;
		if (t.updateMatrixWorld(!0), t.getWorldQuaternion(this.tempQuaternion), this.tempVector.set(0, 0, 1).applyQuaternion(this.tempQuaternion), this.tempVector.y = 0, this.tempVector.lengthSq() < 1e-6) {
			this.setCharacterYawDegrees(0);
			return;
		}
		this.tempVector.normalize(), t.getWorldPosition(this.tempVectorB);
		let n = this.camera.position.clone().sub(this.tempVectorB);
		if (n.y = 0, n.lengthSq() < 1e-6) {
			this.setCharacterYawDegrees(0);
			return;
		}
		n.normalize();
		let r = Math.atan2(this.tempVector.x, this.tempVector.z), i = Math.atan2(n.x, n.z);
		this.characterRoot.rotation.y += i - r, this.characterRoot.updateMatrixWorld(!0), this.syncOfficialModelCombineSetup(), this.characterRoot.updateMatrixWorld(!0), this.resetCurrentSpringRuntimeState(), this.updateShaderFaceBasis();
	}
	getRuntimeDebugSnapshot() {
		return {
			...structuredClone(this.runtimeDebug),
			headMaterialSlots: this.currentHeadAsset?.faceMaterials.map((e) => ({
				meshName: e.meshName,
				slotIndex: e.slotIndex,
				materialKey: e.materialKey,
				materialName: e.materialName,
				materialKind: e.materialKind,
				isAccessory: e.isAccessory,
				valueTex: e.valueTex
			})) ?? [],
			nativeMeshes: this.lastNativeMeshInstallDiagnostics,
			constraints: this.lastConstraintSetupDiagnostics,
			funit: Er(this.currentRuntimeExtension),
			hairShadowOffset: $(this.currentHairOffset),
			hairShadowWorldPosition: $(this.hairHeadPosition),
			camera: this.getCameraDebugSnapshot(),
			faceLight: this.getFaceLightDebugSnapshot(),
			projectedShadow: this.projectedShadow.getDebugSnapshot(this.characterModelScaleMeters)
		};
	}
	getFaceLightDebugSnapshot() {
		let e = this.directionalLight.position.clone().normalize(), t = this.characterLighting.resolveFaceShadowLightDirection(this.getCameraRootFaceShadowLightDirection(), this.faceRightWorld, this.faceForwardWorld), n = new y.Vector2(), r = new y.Vector2(), i = new y.Vector2(), a = new y.Vector2();
		X(n, -this.headTransformUpWorld.x, -this.headTransformUpWorld.z), X(r, this.faceRightWorld.x, this.faceRightWorld.z), X(i, this.faceForwardWorld.x, this.faceForwardWorld.z), X(a, t.x, t.z);
		let o = y.MathUtils.radToDeg(Math.atan2(this.faceForwardWorld.x, this.faceForwardWorld.z)), s = y.MathUtils.radToDeg(Math.atan2(a.x, a.y)), c = this.faceForwardWorld.clone().normalize(), l = this.faceRightWorld.clone().sub(c.clone().multiplyScalar(this.faceRightWorld.dot(c))).normalize(), u = this.faceUpWorld.clone().sub(c.clone().multiplyScalar(this.faceUpWorld.dot(c))).sub(l.clone().multiplyScalar(this.faceUpWorld.dot(l))).normalize(), d = new y.Vector3(t.dot(l), t.dot(u), t.dot(c)), f = Math.max(Math.hypot(d.x, d.z), .001), p = d.x / f, m = d.z / f, h = (this.faceMaterial.uniforms.uUseFaceShadowLimiter?.value ?? 1) > .5, g = this.faceMaterial.uniforms.uFaceShadowLimitRange?.value ?? 0, _ = this.headDotDirectionalLight.y, v = y.MathUtils.clamp(h ? Math.min(Math.max((1 - Math.abs(2 * _ - 1)) * .5, 0), g) : _, 0, 1);
		return {
			lightDirection: $(t),
			previewLightDirection: $(e),
			costumeShopLightRotationDegrees: $(rr),
			faceRightWorld: $(l),
			faceUpWorld: $(u),
			faceForwardWorld: $(c),
			headHorizontalFromUp: {
				x: Number(n.x.toFixed(5)),
				y: Number(n.y.toFixed(5))
			},
			headHorizontalFromRight: {
				x: Number(r.x.toFixed(5)),
				y: Number(r.y.toFixed(5))
			},
			headHorizontalFromForward: {
				x: Number(i.x.toFixed(5)),
				y: Number(i.y.toFixed(5))
			},
			lightHorizontal: {
				x: Number(a.x.toFixed(5)),
				y: Number(a.y.toFixed(5))
			},
			headDotDirectionalLight: {
				x: Number(this.headDotDirectionalLight.x.toFixed(5)),
				y: Number(this.headDotDirectionalLight.y.toFixed(5))
			},
			faceTbnLight: $(d),
			faceLight: {
				side: Number(p.toFixed(5)),
				front: Number(m.toFixed(5))
			},
			faceSdfLimit: Number(v.toFixed(5)),
			headYawDegrees: Number(o.toFixed(3)),
			lightYawDegrees: Number(s.toFixed(3))
		};
	}
	getCameraDebugSnapshot() {
		let e = this.camera.position, t = this.controls?.target ?? this.cameraTarget, n = e.clone().sub(t), r = new y.Spherical().setFromVector3(n), i = (this.currentCameraPreset === "capture" ? pt(this.currentCameraProfile ?? "full-body", this.cameraRootYawDegrees) : null)?.costumeShopState ?? null;
		return {
			preset: this.currentCameraPreset,
			profile: this.currentCameraProfile,
			characterRootYawDegrees: Number(y.MathUtils.radToDeg(this.characterRoot.rotation.y).toFixed(3)),
			costumeShopState: i === null ? null : {
				cameraRootYawDegrees: Number(i.cameraRootYawDegrees.toFixed(3)),
				zoomValue: Number(i.zoomValue.toFixed(4)),
				zoomMoveValue: Number(i.zoomMoveValue.toFixed(4)),
				zoomRatio: Number(i.zoomRatio.toFixed(4)),
				localCameraPosition: {
					x: Number(i.localCameraPosition.x.toFixed(4)),
					y: Number(i.localCameraPosition.y.toFixed(4)),
					z: Number(i.localCameraPosition.z.toFixed(4))
				},
				localCameraRotationYDegrees: i.localCameraRotationYDegrees
			},
			position: {
				x: Number(e.x.toFixed(4)),
				y: Number(e.y.toFixed(4)),
				z: Number(e.z.toFixed(4))
			},
			target: {
				x: Number(t.x.toFixed(4)),
				y: Number(t.y.toFixed(4)),
				z: Number(t.z.toFixed(4))
			},
			offset: {
				x: Number(n.x.toFixed(4)),
				y: Number(n.y.toFixed(4)),
				z: Number(n.z.toFixed(4))
			},
			distance: Number(r.radius.toFixed(4)),
			polarDegrees: Number(y.MathUtils.radToDeg(r.phi).toFixed(3)),
			azimuthDegrees: Number(y.MathUtils.radToDeg(r.theta).toFixed(3)),
			fovDegrees: Number(this.camera.fov.toFixed(3)),
			aspect: Number(this.camera.aspect.toFixed(4)),
			zoom: Number(this.camera.zoom.toFixed(4)),
			minPolarDegrees: Number(y.MathUtils.radToDeg(this.controls?.minPolarAngle ?? y.MathUtils.degToRad(82)).toFixed(3)),
			maxPolarDegrees: Number(y.MathUtils.radToDeg(this.controls?.maxPolarAngle ?? y.MathUtils.degToRad(100)).toFixed(3)),
			masterCharacterHeightMeters: Number(this.masterCharacterHeightMeters.toFixed(4)),
			characterModelScaleMeters: Number(this.characterModelScaleMeters.toFixed(4))
		};
	}
	onCameraDebugChange(e) {
		this.cameraDebugChangeCallback = e;
	}
	getSpringBoneSnapshot(e) {
		return dr(this.currentRuntimeExtension, !1, this.currentSpringRuntime?.getSnapshot(this.isSpringRuntimeEnabled(), e) ?? null);
	}
	setUtjSpringBoneTraceFilters(e, t) {
		this.currentSpringRuntime?.setTraceBoneFilters(e, t);
	}
	getUtjSpringBoneTraceSnapshot() {
		return this.currentSpringRuntime?.getTraceSnapshot() ?? null;
	}
	getAnimationSnapshot() {
		let e = this.currentSpringRuntime?.getControlledTrackNodeNames() ?? /* @__PURE__ */ new Set(), t = this.animationPlayback.getSnapshot({
			faceMotionEnabled: this.faceMotion.isEnabled(),
			utjControlledNodeNames: e
		});
		return t.bodyRetargetDebug ? {
			...t,
			bodyRetargetDebug: {
				...t.bodyRetargetDebug,
				prefabHeadFollow: this.getPrefabHeadFollowDebugSnapshot()
			}
		} : t;
	}
	getFaceMotionSnapshot() {
		return this.faceMotion.getSnapshot();
	}
	setAnimationPaused(e) {
		this.animationPlayback.setPaused(e);
	}
	setAnimationSpeed(e) {
		this.animationPlayback.setSpeed(e);
	}
	setFaceMotionEnabled(e) {
		this.faceMotion.setEnabled(e);
	}
	setBodyHeadTracksEnabled(e) {
		this.animationPlayback.setBodyHeadTracksEnabled(e) && this.reloadAnimationPlayback();
	}
	setUtjSpringBoneEnabled(e) {
		this.setSpringRuntimeMode(e ? "unity-prefab" : "off");
	}
	setSpringRuntimeMode(e) {
		this.springRuntimeMode !== e && (this.currentSpringRuntime?.resetPose(), this.springRuntimeMode = e, this.resetCurrentSpringRuntimeState());
	}
	resetCurrentSpringRuntimeState() {
		this.currentSpringRuntime?.resetStateToCurrentPose();
	}
	isSpringRuntimeEnabled() {
		return this.springRuntimeMode !== "off";
	}
	createSpringRuntime(e) {
		let t = s.fromPjskRuntimeExtension(this.currentRuntimeExtension, e);
		return t && this.currentSpringTimelineControl && t.setTimelineControl(this.currentSpringTimelineControl), t;
	}
	setSpringTimelineControl(e) {
		this.currentSpringTimelineControl = e ? { ...e } : null, this.currentSpringTimelineControl ? this.currentSpringRuntime?.setTimelineControl(this.currentSpringTimelineControl) : this.currentSpringRuntime?.clearTimelineControl();
	}
	seekAnimation(e) {
		this.prepareSpringRuntimeForAnimationSeek(), this.applyAnimationSeekResult(this.animationPlayback.seek(e));
	}
	seekAnimationPhase(e) {
		return this.prepareSpringRuntimeForAnimationSeek(), this.applyAnimationSeekResult(this.animationPlayback.seekPhase(e)), this.getAnimationSnapshot();
	}
	seekAnimationLoopPhase(e) {
		return this.prepareSpringRuntimeForAnimationSeek(), this.applyAnimationSeekResult(this.animationPlayback.seekLoopPhase(e)), this.getAnimationSnapshot();
	}
	prepareSpringRuntimeForAnimationSeek() {
		this.currentSpringRuntime?.resetPose();
	}
	applyAnimationSeekResult(e) {
		this.faceMotion.seek(e), this.syncOfficialModelCombineSetup(), this.resetCurrentSpringRuntimeState();
	}
	setPresentationMode(e) {
		this.setCapturePresentation(e === "capture");
	}
	setCapturePresentation(e) {
		if (this.capturePresentationEnabled === e) {
			e && this.handleResize();
			return;
		}
		if (this.capturePresentationEnabled = e, e) {
			this.scene.fog = null, this.sceneReference.visible = !1, this.handleResize();
			return;
		}
		this.scene.fog = new y.Fog("#7f8d95", 5.5, 15), this.sceneReference.visible = !1;
	}
	stepCharacterDynamics(e, t) {
		let n = Math.max(0, e);
		t && (this.animationPlayback.step(n), this.faceMotion.step(n, this.animationPlayback.getSpeed(), this.animationPlayback.isPaused())), this.syncOfficialModelCombineSetup(), this.currentExtraBoneRuntime?.update(), this.isSpringRuntimeEnabled() ? this.currentSpringRuntime?.update(n) : this.currentSpringRuntime?.resetPose();
	}
	stepCaptureFrame(e, t) {
		this.stepCharacterDynamics(e, t), this.updateProjectedShadows(), this.updateShaderCameraPositions(), this.updateShaderFaceBasis();
	}
	getCharacterRoot() {
		return this.characterRoot;
	}
	updateProjectedShadows() {
		if (!this.currentBodyAsset) {
			this.projectedShadow.update({
				targetWorldPositions: [],
				lightWorldPosition: null,
				characterModelScale: this.characterModelScaleMeters,
				visible: !1
			});
			return;
		}
		let e = new y.Vector3();
		this.directionalLight.getWorldPosition(e), this.projectedShadow.update({
			targetWorldPositions: this.resolveProjectedShadowTargetWorldPositions(),
			lightWorldPosition: e,
			characterModelScale: this.characterModelScaleMeters,
			visible: !0
		});
	}
	resolveProjectedShadowTargetWorldPositions() {
		let e = this.currentBodyAnimationRoot ?? this.characterRoot;
		return e.updateMatrixWorld(!0), vt.map((t) => this.findNodeByImportedName(e, t)).filter((e) => e !== null).map((e) => e.getWorldPosition(new y.Vector3()));
	}
	getCanvas() {
		return this.renderer.domElement;
	}
	waitForPostProcessorReady() {
		return Promise.resolve();
	}
	setViewportSize(e, t) {
		let n = this.ownsCanvas ? 320 : 1, r = Math.max(Math.trunc(e) || 0, n), i = Math.max(Math.trunc(t) || 0, n), a = tr(r, i, window.devicePixelRatio);
		this.viewportWidth === r && this.viewportHeight === i && this.viewportPixelRatio === a || (this.camera.aspect = r / i, this.camera.updateProjectionMatrix(), this.renderer.setPixelRatio(a), this.renderer.setSize(r, i, this.ownsCanvas), this.updateCaptureBackgroundTexture(r, i), this.viewportWidth = r, this.viewportHeight = i, this.viewportPixelRatio = a);
	}
	renderFrame() {
		this.renderer.render(this.scene, this.camera);
	}
	finishCaptureFrame() {
		this.renderer.getContext().finish();
	}
	stepRuntimeFrame(e, t = {}) {
		this.stepCaptureFrame(e, t.advanceAnimation ?? !0), this.updateLayerMaterialTime(t.elapsedTime ?? this.clock.elapsedTime);
	}
	async loadRuntimePackage(e) {
		let t = this.currentLoadedRuntimePackage?.wardrobe?.getActiveRoleId() ?? null, n = e.roleId ?? null;
		t && n && t !== n && (this.releaseCurrentCharacterResources({
			preserveAnimationSelection: !1,
			clearAnimationCache: !0
		}), this.currentLoadedRuntimePackage = null);
		let r = await u(e.baseUrl, e);
		if (this.currentLoadedRuntimePackage = r, r.previewLight && this.updatePreviewLight(r.previewLight), await this.setAnimationSelection(null), this.setFaceMotionSet(null, null, null), !r.combinedCharacter) return r;
		await this.importCombinedCharacter(r.combinedCharacter);
		let i = r.combinedCharacter.bodyAsset.source.animationUrls?.[0], a = l(i ?? null), o = i && (a === "unity-json" || /body[_-]?motion/i.test(i.split(/[/?#]/)[0] ?? "")) ? i : null, s = Mt(r.combinedCharacter.runtimeExtension);
		return e.applyFaceMotion !== !1 && (r.faceMotion ?? s) && this.setFaceMotionSet(r.faceMotion ?? s, "face", o ? "face_loop" : null), e.applyDefaultAnimation !== !1 && i && await this.setAnimationSelection({
			motionUrl: i,
			motionKind: a,
			loopUrl: o,
			loopKind: o ? a : null
		}), r;
	}
	async setCustomSelection(e) {
		return this.enqueueCustomSelectionMutation((t) => this.applyCustomSelection(e, t));
	}
	async updateCustomSelection(e, t) {
		return this.enqueueCustomSelectionMutation(async (n) => {
			let r = this.currentLoadedRuntimePackage?.wardrobe;
			if (!r) throw Error("No custom part package is loaded.");
			let i = r.getCustomSelection();
			if (!i) throw Error("No custom selection is active.");
			return this.applyCustomSelection({
				...i,
				bodyCostume3dId: e === "body" && t !== null ? t : i.bodyCostume3dId,
				headCostume3dId: e === "head" && t !== null ? t : i.headCostume3dId,
				headPackagePath: e === "head" && t !== null ? null : i.headPackagePath,
				hairCostume3dId: e === "hair" && t !== null ? t : i.hairCostume3dId,
				headOptionalCostume3dId: e === "head_optional" ? t : i.headOptionalCostume3dId
			}, n);
		});
	}
	async loadRenderRecipe(e) {
		return this.enqueueCustomSelectionMutation((t) => this.loadRenderRecipeInternal(e, t));
	}
	enqueueCustomSelectionMutation(e) {
		let t = ++this.customSelectionGeneration, n = () => t === this.customSelectionGeneration, r = () => {
			if (!n()) throw Ar();
			return e(n);
		}, i = this.customSelectionQueue.then(r, r);
		return this.customSelectionQueue = i.catch(() => void 0), i;
	}
	async applyCustomSelection(e, t = () => !0) {
		let r = this.currentLoadedRuntimePackage?.wardrobe;
		if (!r) throw Error("No custom part package is loaded.");
		let i = r.getCustomSelection(), a = r.getCombinedCharacter()?.id ?? null, o = await r.setCustomSelection(e, t);
		if (!t()) throw Ar();
		let s = a !== null && a === o.id, c = o.bodyAsset.source.animationUrls?.[0] ?? null, u = l(c), d = c && (u === "unity-json" || /body[_-]?motion/i.test(c.split(/[/?#]/)[0] ?? "")) ? c : null, f = a !== null && i !== null && n(i.characterId, i.unit) === n(e.characterId, e.unit) && this.animationPlayback.matchesSelection(c, d);
		return s || await this.importCombinedCharacter(o, {
			preserveAnimation: f,
			disposeBeforeLoad: !0,
			clearAnimationCache: !1
		}), await this.applyCustomRoleDefaultMotion(o, !f), o;
	}
	async loadRenderRecipeInternal(e, r) {
		let i = String(e.baseUrl ?? "").trim();
		if (!i) throw Error("baseUrl is required to load a render recipe.");
		let a = c(e), o = kr(a.roleId), s = n(o.characterId, o.unit), l = this.currentLoadedRuntimePackage, u = l?.partSet?.baseUrl ?? null, d = l?.wardrobe?.getActiveRoleId() ?? null;
		(!l?.wardrobe || u !== i || d !== s) && await this.loadRuntimePackage({
			baseUrl: i,
			roleId: s,
			deferDefaultSelection: !0,
			applyDefaultAnimation: !1,
			applyFaceMotion: !1
		});
		let f = this.currentLoadedRuntimePackage?.wardrobe;
		if (!f) throw Error("No custom part package is loaded.");
		f.getActiveRoleId() !== s && f.selectRole(o.characterId, o.unit);
		let p = f.getPartPackageSet();
		p && await t(p, o.characterId, o.unit);
		let m = {
			characterId: o.characterId,
			unit: o.unit,
			bodyCostume3dId: a.bodyCostume3dId,
			headCostume3dId: a.headCostume3dId,
			headPackagePath: a.headPackagePath,
			hairCostume3dId: a.hairCostume3dId,
			headOptionalCostume3dId: a.headOptionalCostume3dId
		};
		return {
			selection: m,
			combinedCharacter: await this.applyCustomSelection(m, r)
		};
	}
	async applyCustomRoleDefaultMotion(e, t) {
		let n = e.bodyAsset.source.animationUrls?.[0], r = l(n ?? null), i = n && (r === "unity-json" || /body[_-]?motion/i.test(n.split(/[/?#]/)[0] ?? "")) ? n : null, a = Mt(e.runtimeExtension);
		a && (t || !this.faceMotion.hasMotion()) && this.setFaceMotionSet(a, "face", i ? "face_loop" : null), n && (t || !this.animationPlayback.hasSelection()) && await this.setAnimationSelection({
			motionUrl: n,
			motionKind: r,
			loopUrl: i,
			loopKind: i ? r : null
		});
	}
	getSnapshots(e) {
		return {
			animation: this.getAnimationSnapshot(),
			faceMotion: this.getFaceMotionSnapshot(),
			springBone: this.getSpringBoneSnapshot(e),
			camera: this.getCameraDebugSnapshot(),
			runtimeDebug: this.getRuntimeDebugSnapshot(),
			utjSpringBoneTrace: this.getUtjSpringBoneTraceSnapshot()
		};
	}
	setFaceMotionSet(e, t, n) {
		this.faceMotion.setMotion(e, t, n);
	}
	async setAnimationSelection(e) {
		return this.animationPlayback.setSelection(e), await this.reloadAnimationPlayback(), this.getAnimationSnapshot();
	}
	updatePreviewLight(e) {
		this.previewLightBase = { ...e }, this.applyPreviewLightForCameraRoot();
	}
	applyPreviewLightForCameraRoot() {
		let e = y.MathUtils.degToRad(this.cameraRootYawDegrees), t = new y.Vector3(this.previewLightBase.x, this.previewLightBase.y, this.previewLightBase.z).applyAxisAngle(J, e), n = B().applyAxisAngle(J, e);
		this.characterLighting.updatePreviewLight({
			...this.previewLightBase,
			x: t.x,
			y: t.y,
			z: t.z
		}, this.currentBodyAsset, this.currentHeadAsset, this.headDotDirectionalLight, this.getCameraRootFaceShadowLightDirection(), n);
	}
	getCameraRootFaceShadowLightDirection() {
		return ir.clone().applyAxisAngle(J, y.MathUtils.degToRad(this.cameraRootYawDegrees));
	}
	updateGlobalShadowColor(e, t = 1) {
		this.characterLighting.updateGlobalShadowColor(e, t);
	}
	updateLightControllerColors(e) {
		this.characterLighting.updateControllerColors(e);
	}
	updateLightControllerRimShape(e) {
		this.characterLighting.updateControllerRimShape(e);
	}
	updateLightControllerOutline(e) {
		this.characterLighting.updateControllerOutline(e);
	}
	destroy() {
		cancelAnimationFrame(this.animationFrame), this.releaseCurrentCharacterResources({
			preserveAnimationSelection: !1,
			clearAnimationCache: !0
		}), this.manageResize && window.removeEventListener("resize", this.handleResize), this.controls?.dispose(), this.projectedShadow.dispose(), this.textureLoader.dispose(), this.captureBackgroundTexture?.dispose(), this.renderer.dispose(), this.ownsCanvas && this.renderer.domElement.parentElement === this.container && this.renderer.domElement.remove();
	}
	addSceneReference() {}
	setCameraTarget(e) {
		this.cameraTarget.copy(e), this.controls?.target.copy(e);
	}
	syncCameraTarget() {
		if (this.controls) {
			this.controls.update(), this.cameraTarget.copy(this.controls.target);
			return;
		}
		this.camera.lookAt(this.cameraTarget);
	}
	applyCostumeShopCharacterHeight(e) {
		let t = y.MathUtils.clamp(e || 1.6, .5, 2), n = Dt(t), r = Math.abs(n - this.characterModelScaleMeters) >= 1e-4;
		if (this.masterCharacterHeightMeters = t, this.characterModelScaleMeters = n, this.characterRoot.scale.setScalar(1), this.currentPrefabSourceGraph && i(this.currentPrefabSourceGraph, n), !r || this.currentCameraPreset !== "default") return;
		let a = ft(n), o = a.position.clone().sub(a.target).applyAxisAngle(J, y.MathUtils.degToRad(this.cameraRootYawDegrees));
		this.setCameraTarget(a.target), this.camera.position.copy(a.target).add(o), this.syncCameraTarget();
	}
	applyCameraPreset(e, t = "full-body") {
		if (this.currentCameraPreset = e, e === "capture") {
			this.currentCameraProfile = t;
			let e = pt(t, this.cameraRootYawDegrees);
			this.setCameraTarget(e.target), this.camera.position.copy(e.position), this.camera.fov = e.fov;
		} else {
			this.currentCameraProfile = null;
			let e = ft(this.characterModelScaleMeters), t = e.position.clone().sub(e.target).applyAxisAngle(J, y.MathUtils.degToRad(this.cameraRootYawDegrees));
			this.setCameraTarget(e.target), this.camera.position.copy(e.target).add(t), this.camera.fov = e.fov;
		}
		this.camera.updateProjectionMatrix(), this.syncCameraTarget(), this.applyPreviewLightForCameraRoot(), this.updateShaderFaceBasis(), this.cameraDebugChangeCallback?.();
	}
	shiftCameraRight(e = 1) {
		if (!Number.isFinite(e) || e === 0) return;
		let t = this.controls?.target ?? this.cameraTarget, n = mt(this.camera.position, t, e, this.characterModelScaleMeters);
		this.setCameraTarget(n.target), this.camera.position.copy(n.position), this.syncCameraTarget(), this.cameraDebugChangeCallback?.();
	}
	makeImportStatus(e, t) {
		return {
			assetId: e.id,
			displayName: e.displayName,
			sourceMode: t.sourceMode,
			requestedUrl: t.requestedUrl,
			meshCount: t.meshCount,
			boneCount: t.boneCount,
			skinnedMeshCount: t.skinnedMeshCount
		};
	}
	resetSlotParents() {
		this.bodySlot.parent?.remove(this.bodySlot), this.headSlot.parent?.remove(this.headSlot), this.characterRoot.add(this.bodySlot), this.characterRoot.add(this.headSlot);
	}
	getPersistentCharacterMaterials() {
		return /* @__PURE__ */ new Set([
			this.bodyMaterial,
			this.hairMaterial,
			this.faceMaterial
		]);
	}
	clearCharacterSlot(e) {
		hr(e, this.getPersistentCharacterMaterials());
	}
	releaseCurrentCharacterResources(e = {}) {
		this.animationPlayback.release({
			preserveSelection: e.preserveAnimationSelection,
			clearCache: e.clearAnimationCache
		}), this.faceMotion.release({ preserveMotion: e.preserveAnimationSelection }), this.currentSpringRuntime?.resetPose(), this.currentSpringRuntime = null, this.currentExtraBoneRuntime = null, this.currentConstraintRuntime = null, this.currentRuntimeExtension = null, this.currentBodyAttachNode = null, this.currentHeadAttachOriginNode = null, this.currentBodyAnimationRoot = null, this.currentPrefabSourceGraph = null, this.currentPrefabHeadFollowDebug = {
			active: !1,
			sourcePath: null,
			targetPath: null,
			reason: "not initialized"
		}, this.runtimeDebug.headMorphs = [], this.clearCharacterSlot(this.bodySlot), this.clearCharacterSlot(this.headSlot), this.resetSlotParents(), this.renderer.renderLists.dispose(), this.renderer.info.reset();
	}
	findNodeByName(e, t) {
		return t ? this.findNodeByImportedName(e, t) : null;
	}
	findNodeByImportedName(e, t) {
		let n = e.getObjectByName(t);
		if (n) return n;
		for (let n = 1; n <= 16; n++) {
			let r = e.getObjectByName(`${t}_${n}`);
			if (r) return r;
		}
		return null;
	}
	findBoneByImportedName(e, t) {
		let n = e.get(t);
		if (n) return n;
		for (let n = 1; n <= 16; n++) {
			let r = e.get(`${t}_${n}`);
			if (r) return r;
		}
		return null;
	}
	getNodeDepth(e) {
		let t = 0, n = e.parent;
		for (; n;) t += 1, n = n.parent;
		return t;
	}
	prepareCombinedComposition() {
		let e = this.currentPrefabSourceGraph;
		if (!e) throw Error("Official model_combine_setup graph is not loaded.");
		return this.currentCompositionStatus = {
			mode: "model_combine_setup",
			missingBodyBones: e.bodyAttach ? [] : ["Unity prefab body attach unresolved"],
			missingHeadBones: e.headRoot && e.headOrigin ? [] : ["Unity prefab head root/origin unresolved"]
		}, this.currentCompositionStatus;
	}
	async loadCombinedCharacterAsset(e) {
		if (!e.unityRuntimeJsonUrl) throw Error("Final runtime package must provide container.unityRuntimeJson.");
		let t = d(e.runtimeExtension, null);
		if (!t) throw Error("Final runtime package must provide runtimeUnitySetup version 0414.");
		this.currentPrefabSourceGraph = t, this.syncUnityPrefabSourceGraph();
		let n = a(t, e.runtimeExtension);
		if (this.lastNativeMeshInstallDiagnostics = n, n.error) throw Error(`${n.error}${n.warnings.length ? ` ${n.warnings.slice(0, 3).join(" ")}` : ""}`);
		return this.syncUnityPrefabSourceGraph(), await Promise.all([this.overrideBodyMaterials(t.root, e.bodyAsset), this.overrideHeadMaterials(t.root, e.headAsset, {
			eyeController: Tr(e.runtimeExtension),
			hairController: Dr(e.runtimeExtension)
		})]), this.installSekaiOutlineShells(t.root), {
			root: t.root,
			sourceMode: "unity-runtime",
			requestedUrl: e.unityRuntimeJsonUrl,
			meshCount: n.meshCount,
			boneCount: n.boneCount,
			skinnedMeshCount: n.skinnedMeshCount,
			prefabSourceGraph: t
		};
	}
	installSekaiOutlineShells(e) {
		let t = [];
		e.traverse((e) => {
			let n = e;
			!n.isMesh || n.userData.pjskOutlineShell || n.userData.pjskEyeThroughHairOverlay || n.userData.pjskEyeThroughHairStencilPrepass || t.push(n);
		});
		for (let e of t) {
			let t = vr(e);
			if (br(t)) continue;
			let n = yr(t), r = gr(e.geometry);
			if (r === null || r <= .01) continue;
			let i = Array.isArray(e.material) ? e.material : [e.material], a = i.map((e) => e.name), o = i.map((t) => {
				let n = t.userData.pjskOutlineSourceMaterial instanceof y.ShaderMaterial ? t.userData.pjskOutlineSourceMaterial : null;
				if (delete t.userData.pjskOutlineSourceMaterial, _r(t.userData.pjskMaterialKind)) {
					n?.dispose();
					let e = new y.MeshBasicMaterial();
					return e.name = "pjsk_shell_outline_skipped", e.visible = !1, e;
				}
				let r = t.userData.pjskRawMaterial;
				if (!hn(r)) {
					n?.dispose();
					let e = new y.MeshBasicMaterial();
					return e.name = "pjsk_shell_outline_disabled", e.visible = !1, e;
				}
				let i = t.userData.pjskLighting, a = (i?.useOutlineSecondNormal ?? 0) > .5 && !!e.geometry.getAttribute("tangent") && !!e.geometry.getAttribute("uv1") && !!e.geometry.getAttribute("uv2"), o = bn(!!e.geometry.getAttribute("color"), r, a, xr(t), n ?? t);
				return o.userData.pjskOutlineUseSecondNormal = a, o.userData.pjskOutlineWantsSecondNormal = (i?.useOutlineSecondNormal ?? 0) > .5, n?.dispose(), this.characterLighting.applyOutlineMaterial(o), o;
			});
			if (!o.some((e) => e.visible)) {
				for (let e of o) e.dispose();
				continue;
			}
			let s = Array.isArray(e.material) ? o : o[0], c = e instanceof y.SkinnedMesh ? new y.SkinnedMesh(e.geometry, s) : new y.Mesh(e.geometry, s);
			c.name = `${e.name}_outline`, c.renderOrder = Math.max(e.renderOrder - 2, 0), c.frustumCulled = e.frustumCulled, c.userData.pjskOutlineShell = !0, c.userData.pjskSourceMaterialKind = n, c.matrixAutoUpdate = e.matrixAutoUpdate, c.position.copy(e.position), c.quaternion.copy(e.quaternion), c.scale.copy(e.scale), c instanceof y.SkinnedMesh && e instanceof y.SkinnedMesh && c.bind(e.skeleton, e.bindMatrix), this.runtimeDebug.outlineShells.push({
				meshName: e.name,
				outlineName: c.name,
				sourceMaterialKind: n,
				sourceMaterialKinds: t,
				sourceMaterialNames: a,
				hasVertexColor: !!e.geometry.getAttribute("color"),
				vertexColorRedMax: r,
				renderOrder: c.renderOrder,
				sourceRenderOrder: e.renderOrder,
				hasTangent: !!e.geometry.getAttribute("tangent"),
				hasUv1: !!e.geometry.getAttribute("uv1"),
				hasUv2: !!e.geometry.getAttribute("uv2"),
				useSecondNormal: o.map((e) => e.userData.pjskOutlineUseSecondNormal === !0),
				wantsSecondNormal: o.map((e) => e.userData.pjskOutlineWantsSecondNormal === !0)
			}), e.parent?.add(c);
		}
	}
	async overrideBodyMaterials(e, t) {
		this.runtimeDebug.body = [];
		let n = this.characterLighting.getBindingView();
		await en({
			root: e,
			bodyAsset: t,
			headAsset: this.currentHeadAsset,
			textureLoader: this.textureLoader,
			template: this.bodyMaterial,
			bodyDebugMode: n.bodyDebugMode,
			debug: this.runtimeDebug.body
		});
	}
	async overrideHeadMaterials(e, t, n = {}) {
		let r = this.characterLighting.getBindingView();
		this.runtimeDebug.head = [], this.currentHairOffset.copy(n.hairController?.offset ?? new y.Vector3()), this.currentHairHeadTransform = null;
		let i = n.hairController?.headTransformPath;
		i && e.traverse((e) => {
			!this.currentHairHeadTransform && e.userData.pjskTransformPath === i && (this.currentHairHeadTransform = e);
		}), this.currentHairHeadTransform ??= n.hairController?.headTransformName ? this.findNodeByImportedName(e, n.hairController.headTransformName) : null, await dn({
			root: e,
			headAsset: t,
			textureLoader: this.textureLoader,
			templates: {
				body: this.bodyMaterial,
				hair: this.hairMaterial,
				face: this.faceMaterial
			},
			view: {
				bodyDebugMode: r.bodyDebugMode,
				faceDebugMode: r.faceDebugMode,
				faceSdfEnabled: r.faceSdfEnabled
			},
			hair: {
				controllerPresent: !!n.hairController,
				proximityShadowEnabled: r.proximityHairShadowEnabled,
				headPosition: this.hairHeadPosition
			},
			eyeController: n.eyeController,
			debug: this.runtimeDebug.head
		});
	}
	handleResize() {
		let e = this.container ?? this.renderer.domElement, t = Math.max(e.clientWidth, 320), n = Math.max(e.clientHeight, 320);
		this.setViewportSize(t, n);
	}
	updateCaptureBackgroundTexture(e, t) {
		let n = this.container ?? this.renderer.domElement, r = Math.max(Math.round(e ?? n.clientWidth), 320), i = Math.max(Math.round(t ?? n.clientHeight), 320);
		this.captureBackgroundTexture?.dispose(), this.captureBackgroundTexture = ht(r, i), this.scene.background = this.captureBackgroundTexture;
	}
	updateShaderCameraPositions() {
		this.characterLighting.updateCamera(this.camera.position);
	}
	updateShaderFaceBasis() {
		let e = this.currentHairHeadTransform ?? this.findFaceSdfHeadBone() ?? this.findNodeByImportedName(this.bodySlot, "Head") ?? this.findNodeByImportedName(this.headSlot, "Head") ?? this.currentBodyAnimationRoot ?? this.characterRoot;
		e.getWorldQuaternion(this.tempQuaternion), e.getWorldPosition(this.faceHeadWorldPosition), this.headTransformUpWorld.copy(cr).applyQuaternion(this.tempQuaternion).normalize(), this.faceUpWorld.set(1, 0, 0).applyQuaternion(this.tempQuaternion).normalize(), this.faceForwardWorld.set(0, 0, 1).applyQuaternion(this.tempQuaternion).normalize(), this.faceRightWorld.crossVectors(this.faceUpWorld, this.faceForwardWorld).normalize(), this.faceUpWorld.crossVectors(this.faceForwardWorld, this.faceRightWorld).normalize();
		let t = this.characterLighting.resolveFaceShadowLightDirection(this.getCameraRootFaceShadowLightDirection(), this.faceRightWorld, this.faceForwardWorld);
		X(this.faceShadowHeadHorizontal, -this.headTransformUpWorld.x, -this.headTransformUpWorld.z), X(this.faceShadowLightHorizontal, t.x, t.z);
		let n = y.MathUtils.radToDeg(Math.atan2(this.faceForwardWorld.x, this.faceForwardWorld.z)), r = y.MathUtils.radToDeg(Math.atan2(this.faceShadowLightHorizontal.x, this.faceShadowLightHorizontal.y));
		this.headDotDirectionalLight.set(this.faceShadowHeadHorizontal.dot(this.faceShadowLightHorizontal), Sr(n, r)), this.hairHeadPosition.copy(this.currentHairOffset), e.localToWorld(this.hairHeadPosition), this.runtimeDebug.hairShadowOffset = $(this.currentHairOffset), this.runtimeDebug.hairShadowWorldPosition = $(this.hairHeadPosition), this.characterLighting.updateFaceBasis(t, this.headDotDirectionalLight, this.hairHeadPosition), this.characterLighting.updateEyeThroughHairView(this.camera.position, this.faceHeadWorldPosition, this.faceForwardWorld);
	}
	findFaceSdfHeadBone() {
		for (let e of [this.headSlot, this.bodySlot]) {
			let t = null, n = null;
			if (e.traverse((e) => {
				if (n) return;
				let r = e;
				if (!(!r.isSkinnedMesh || !r.skeleton) && (Array.isArray(r.material) ? r.material : [r.material]).some((e) => e instanceof y.ShaderMaterial && !!e.uniforms.uFaceShadowTex)) for (let e of r.skeleton.bones) {
					if (e.name === "Head" || /^Head_\d+$/.test(e.name)) {
						n = e;
						return;
					}
					!t && e.name.toLowerCase().includes("head") && (t = e);
				}
			}), n ?? t) return n ?? t;
		}
		return null;
	}
	updateLayerMaterialTime(e) {
		for (let t of [this.bodySlot, this.headSlot]) t.traverse((t) => {
			let n = t;
			if (!n.isMesh) return;
			let r = Array.isArray(n.material) ? n.material : [n.material];
			for (let t of r) t instanceof y.ShaderMaterial && t.uniforms.uTime && (t.uniforms.uTime.value = e);
		});
	}
	render() {
		let e = this.clock.getDelta(), t = this.clock.elapsedTime;
		this.stepRuntimeFrame(e, {
			advanceAnimation: !0,
			elapsedTime: t
		}), this.controls?.update(), this.renderFrame(), this.animationFrame = requestAnimationFrame(() => this.render());
	}
	async reloadAnimationPlayback(e = {}) {
		(await this.animationPlayback.refresh({
			root: this.currentBodyAnimationRoot,
			retargetWithUnityPrefab: this.currentPrefabSourceGraph !== null,
			runtimeExtension: this.currentRuntimeExtension,
			prefabHeadFollow: this.getPrefabHeadFollowDebugSnapshot()
		})).poseApplied && (this.syncOfficialModelCombineSetup(), this.currentExtraBoneRuntime?.update(), (e.resetSpring ?? !0) && this.resetCurrentSpringRuntimeState());
	}
	getPrefabHeadFollowDebugSnapshot() {
		return o(this.currentPrefabSourceGraph, this.currentRuntimeExtension, this.currentPrefabHeadFollowDebug);
	}
	syncUnityPrefabSourceGraph() {
		let e = this.currentPrefabSourceGraph;
		e && (this.lastConstraintSetupDiagnostics = p(e, this.currentRuntimeExtension, this.characterModelScaleMeters, this.currentConstraintRuntime));
	}
	syncOfficialModelCombineSetup() {
		this.syncUnityPrefabSourceGraph();
	}
};
//#endregion
//#region src/costume_shop/CostumeShopKernel.ts
function Mr(e) {
	let t = String(e.assetBaseUrl ?? "").trim();
	if (!t) throw Error("assetBaseUrl is required to create the CostumeShop kernel.");
	return Nr(new jr({
		canvas: e.canvas,
		initialLight: { ...e.initialLight ?? ke },
		autoRender: !1,
		manageResize: !1,
		ktx2TranscoderPath: e.ktx2TranscoderPath
	}), t);
}
function Nr(t, n) {
	let r = e(t, n);
	return {
		...r,
		setCharacterYawDegrees: r.setViewYawDegrees
	};
}
var Pr = Mr, Fr = Nr;
//#endregion
export { Ee as $, R as A, pt as B, Jt as C, qt as D, Ut as E, Et as F, Be as G, mt as H, Dt as I, Me as J, M as K, St as L, Ft as M, Nt as N, z as O, Mt as P, De as Q, xt as R, Kt as S, $t as T, Ge as U, ft as V, Le as W, ke as X, Ne as Y, E as Z, U as _, jr as a, en as b, er as c, Tn as d, T as et, bn as f, W as g, hn as h, Fr as i, L as j, Pt as k, jn as l, pn as m, Nr as n, Dr as o, _n as p, je as q, Pr as r, tr as s, Mr as t, wn as u, dn as v, Yt as w, Gt as x, Wt as y, ht as z };
