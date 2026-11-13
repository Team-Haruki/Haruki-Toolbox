import { A as e, D as t, E as n, O as r, _ as i, a, b as o, c as s, i as c, j as l, k as u, l as d, n as f, r as p, s as m, t as h, v as g, w as _, x as v } from "./unityPrefabRuntime-CVB0-Z9P.js";
import * as y from "three";
import { CompressedArrayTexture as b, CompressedCubeTexture as x, CompressedTexture as S, Data3DTexture as ee, DataTexture as C, FileLoader as w, FloatType as te, HalfFloatType as T, LinearFilter as ne, LinearMipmapLinearFilter as E, LinearSRGBColorSpace as re, Loader as ie, NoColorSpace as ae, RGBAFormat as oe, RGBA_ASTC_4x4_Format as se, RGBA_ASTC_6x6_Format as ce, RGBA_BPTC_Format as le, RGBA_ETC2_EAC_Format as ue, RGBA_PVRTC_4BPPV1_Format as de, RGBA_S3TC_DXT1_Format as fe, RGBA_S3TC_DXT3_Format as pe, RGBA_S3TC_DXT5_Format as me, RGB_BPTC_UNSIGNED_Format as he, RGB_ETC1_Format as ge, RGB_ETC2_Format as _e, RGB_PVRTC_4BPPV1_Format as ve, RGB_S3TC_DXT1_Format as ye, RGFormat as be, RedFormat as xe, SRGBColorSpace as Se, UnsignedByteType as D } from "three";
//#region src/data/costumeShopLights.ts
var Ce = {
	x: -15,
	y: 50,
	z: 0
}, we = {
	x: -.7127446532249451,
	y: .258819043636322,
	z: .6519262194633484
}, Te = {
	x: .833125114440918,
	y: -.3420201539993286,
	z: .43465474247932434
}, Ee = {
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
}, De = we, Oe = {
	x: De.x,
	y: De.y,
	z: De.z,
	intensity: 1,
	ambient: 0,
	shadowThreshold: .40625,
	shadowWeight: 1,
	characterAmbient: Ee.ambientIntensity,
	rimColorAlpha: Ee.rimColorAlpha,
	rimRange: Ee.rimRange,
	rimEdgeSmoothness: Ee.rimEdgeSmoothness,
	rimEmission: Ee.rimEmission,
	rimLightInfluence: Ee.rimLightInfluence,
	rimShadowSharpness: Ee.rimShadowSharpness
}, ke = "model3d/motion/result/01", Ae = "character/motion/costume_setting/";
function je(e, t, n) {
	let r = e.gameCharacterUnits.find((e) => e.gameCharacterId === t && e.unit === n);
	if (!r) throw Error(`gameCharacterUnits has no unit ${n ?? "(none)"} of character ${t}`);
	return r;
}
function Me(e, t, n, r = Math.random) {
	let i = e.gameCharacterUnit3dMotions.filter((e) => e.motionType === n && e.gameCharacterUnitId === t);
	return i.length ? i[Math.floor(r() * i.length)] : null;
}
function Ne(e, t, n, r, i = Math.random) {
	let a;
	if (n === "preview") {
		let n = e.gameCharacters.find((e) => e.id === t.gameCharacterId);
		if (!n) throw Error(`gameCharacters has no character ${t.gameCharacterId}`);
		a = Ae + (n.figure === "ladies" || n.figure === "girls" ? "ladies" : "mens");
	} else if (n === "result") a = `model3d/motion/result/${String(t.id).padStart(2, "0")}`;
	else {
		let n = je(e, t.gameCharacterId, t.unit), r = Me(e, n.id, "costume_setting", i);
		if (!r) throw Error(`gameCharacterUnit ${n.id} has no costume_setting motion`);
		a = Ae + r.assetbundleName;
	}
	return r(a) ? a : ke;
}
function Pe(e, t) {
	let n = [...e.gameCharacterUnits].sort((e, t) => e.id - t.id), r = [];
	for (let i of n) {
		let n = {
			motionRoleId: `${i.gameCharacterId}:${i.unit}`,
			characterId: i.gameCharacterId,
			unit: i.unit,
			figure: null
		};
		e.gameCharacterUnit3dMotions.some((e) => e.gameCharacterUnitId === i.id && e.motionType === "costume_setting" && t(Ae + e.assetbundleName)) && r.push({
			motionType: "costume",
			...n
		}), t(`model3d/motion/result/${String(i.id).padStart(2, "0")}`) && r.push({
			motionType: "result",
			...n
		});
	}
	let i = new Map(e.gameCharacters.map((e) => [e.id, e.figure === "ladies" || e.figure === "girls" ? "ladies" : "mens"]));
	for (let e of ["ladies", "mens"]) {
		let a = n.find((t) => i.get(t.gameCharacterId) === e);
		a && t(Ae + e) && r.push({
			motionType: "preview",
			motionRoleId: `${a.gameCharacterId}:${a.unit}`,
			characterId: null,
			unit: null,
			figure: e
		});
	}
	return r;
}
//#endregion
//#region src/original/costumeIndex.ts
function Fe(e, t) {
	let n = e.gameCharacters.find((e) => e.id === t), r = e.gameCharacterUnits.filter((e) => e.gameCharacterId === t).sort((e, t) => e.id - t.id).map((e) => e.unit);
	return n?.supportUnitType === "full" || !n?.unit ? r : r.includes(n.unit) ? [n.unit] : r.slice(0, 1);
}
var Ie = /* @__PURE__ */ new Set([
	"head_only",
	"head_all",
	"head_front",
	"head_back"
]), Le = (e) => !!e && Ie.has(e.toLowerCase()), Re = (e) => e?.toLowerCase() === "head_and_hair";
function ze(e, t) {
	let n = `live_pv/model/characterv2/${t}`;
	if (e(n)) return n;
	let r = `live_pv/model/character/${t}`;
	return e(r) ? r : null;
}
var Be = (e) => e.breastSize === "none" ? e.figure : `${e.figure}_${e.breastSize}`, Ve = [
	"head_all",
	"head_front",
	"head_back"
];
function He(e, t, n) {
	let r = (t.includes("0000") || t.includes("0001")) && n && Ve.includes(n.toLowerCase()) ? `${t}_${n.toLowerCase()}` : t, i = "live_pv/model/character/face/21/0001";
	return ze(e, `face/${r}`) ?? ze(e, `face/${r.replace("0000", "0001")}`) ?? (e(i) ? i : null);
}
function Ue(e, t) {
	let n = [
		t.assetbundleName,
		e?.assetbundleName,
		t.thumbnailAssetbundleName
	].find((e) => e && e.trim())?.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "") ?? "", r = n.split("/").filter(Boolean);
	if (!r.length) return {
		accessoryId: null,
		attachNode: null,
		empty: !1
	};
	let i = t.part && t.part.trim() ? t.part : r.length > 1 ? r[1] : null, a = !i && (n.split("/").pop() ?? "").toLowerCase().startsWith("head_default_");
	return {
		accessoryId: r[0],
		attachNode: i,
		empty: a
	};
}
var We = (e) => e ?? "default";
function Ge(e, t) {
	let n = new Map(e.gameCharacters.map((e) => [e.id, e])), r = new Map(e.costume3ds.map((e) => [e.id, e])), i = /* @__PURE__ */ new Map();
	for (let t of e.costume3dModels) {
		let e = i.get(t.costume3dId) ?? [];
		e.push(t), i.set(t.costume3dId, e);
	}
	let a = [];
	for (let r of [...e.costume3ds].sort((e, t) => e.id - t.id)) {
		let e = i.get(r.id) ?? [];
		for (let i of [...e].sort((e, t) => (e.unit ?? "").localeCompare(t.unit ?? ""))) a.push(Ke(r, i, r.characterId, n, t));
	}
	let o = /* @__PURE__ */ new Map();
	for (let e of a) {
		let t = `${e.costume3dId}|${e.unit ?? ""}`;
		o.set(t, [...o.get(t) ?? [], e]);
	}
	let s = new Set(a.map((e) => `${e.characterId}|${e.unit ?? ""}|${e.partType}|${e.costume3dId}`));
	for (let c of [...e.character3ds].sort((e, t) => e.id - t.id)) for (let e of [
		c.bodyCostume3dId,
		c.headCostume3dId,
		c.hairCostume3dId
	]) {
		let l = o.get(`${e}|${c.unit ?? ""}`) ?? o.get(`${e}|`) ?? [];
		for (let e of l) {
			if (e.characterId === c.characterId) continue;
			let o = Ke(r.get(e.costume3dId), (i.get(e.costume3dId) ?? []).find((t) => (t.unit ?? null) === (e.unit ?? null)), c.characterId, n, t);
			o.unit = e.unit ?? c.unit, o.presetAlias = !0;
			let l = `${o.characterId}|${o.unit ?? ""}|${o.partType}|${o.costume3dId}`;
			s.has(l) || (s.add(l), a.push(o));
		}
	}
	return a;
}
function Ke(e, t, n, r, i) {
	let a = [], o = Le(t.headCostume3dAssetbundleType) ? "head_optional" : e.partType, s = r.get(n), c = null, l = null, u = null, d = "missing";
	if (o === "body") s ? t.assetbundleName ? (c = ze(i, `body/${t.assetbundleName}/${Be(s)}`), c || a.push(`body bundle not found: ${t.assetbundleName}/${Be(s)}`), t.colorAssetbundleName && (l = ze(i, `color_variation/body/${t.assetbundleName}/${Be(s)}/${t.colorAssetbundleName}`), l || a.push(`body color variation not found: ${t.colorAssetbundleName}`))) : a.push("missing model assetbundleName") : a.push(`missing gameCharacters row ${n}`);
	else if (o === "head_optional") {
		let n = Ue(e, t);
		u = n.attachNode, n.empty ? d = "empty" : !n.accessoryId || !n.attachNode ? a.push("head_only row has no accessory id or attach node") : (c = ze(i, `head_optional/${n.accessoryId}/${n.attachNode}`), c || a.push(`head_optional bundle not found: ${n.accessoryId}/${n.attachNode}`), t.colorAssetbundleName && (l = ze(i, `color_variation/head_optional/${n.accessoryId}/${n.attachNode}/${t.colorAssetbundleName}`), l || a.push(`head_optional color variation not found: ${n.accessoryId}/${n.attachNode}/${t.colorAssetbundleName}`)));
	} else (o === "head" || o === "hair") && (t.assetbundleName ? (c = He(i, t.assetbundleName), c || a.push(`face bundle not found: ${t.assetbundleName}`)) : a.push("missing model assetbundleName"));
	c && (d = "ready");
	let f = (e) => `original/${o}/${e.replace(/^live_pv\/model\//, "")}${l ? `/+${l.split("/").pop()}` : ""}`, p = c ? f(c) : `parts/${o}/${e.id}/${We(t.unit)}`, m = null;
	if (o === "hair" && c && t.assetbundleName) for (let e of Ve) {
		let n = He(i, t.assetbundleName, e);
		n && n !== c && ((m ??= {})[e] = {
			bundlePath: n,
			packagePath: f(n)
		});
	}
	return {
		costume3dId: e.id,
		partType: o,
		characterId: n,
		unit: t.unit ?? null,
		name: e.name,
		colorId: e.colorId,
		colorName: e.colorName,
		costume3dGroupId: e.costume3dGroupId,
		thumbnailAssetbundleName: t.thumbnailAssetbundleName ?? e.assetbundleName ?? null,
		modelAssetbundleName: t.assetbundleName ?? null,
		headCostume3dAssetbundleType: t.headCostume3dAssetbundleType ?? null,
		bundlePath: c,
		colorVariationBundlePath: l,
		packagePath: p,
		attachNode: u,
		...m ? { headTypeVariants: m } : {},
		status: d,
		warnings: a
	};
}
function qe(e) {
	let t = (e) => `${e.unit ?? ""}|${e.headCostume3dId}|${e.hairCostume3dId}`, n = /* @__PURE__ */ new Map();
	for (let r of e.costume3dModelNotAvailablePatterns) n.has(t(r)) || n.set(t(r), r);
	let r = /* @__PURE__ */ new Map();
	for (let n of e.costume3dModelDefaultHairs) r.has(t(n)) || r.set(t(n), n);
	let i = /* @__PURE__ */ new Map();
	for (let t of e.costume3dModels) i.set(t.costume3dId, [...i.get(t.costume3dId) ?? [], t]);
	let a = (e, t) => {
		let n = i.get(e) ?? [];
		return n.find((e) => (e.unit ?? "").toLowerCase() === (t ?? "").toLowerCase()) ?? n.find((e) => !e.unit) ?? n[0] ?? null;
	};
	return {
		version: "1",
		rules: [.../* @__PURE__ */ new Set([...n.keys(), ...r.keys()])].sort().map((e) => {
			let t = n.get(e) ?? r.get(e), i = a(t.headCostume3dId, t.unit), o = i && Re(i.headCostume3dAssetbundleType) ? {
				kind: "complete_head",
				active: ["head"]
			} : i && Le(i.headCostume3dAssetbundleType) ? {
				kind: "base_hair_with_head_optional_accessory",
				active: ["hair", "head_optional"]
			} : {
				kind: "custom_head_hair",
				active: ["head", "hair"]
			};
			return {
				unit: t.unit ?? null,
				headCostume3dId: t.headCostume3dId,
				hairCostume3dId: t.hairCostume3dId,
				state: n.has(e) ? "not_available" : "default_hint",
				headCompositionKind: o.kind,
				activeContributors: o.active
			};
		})
	};
}
function Je(e) {
	return {
		version: e.version,
		gameCharacters: e.gameCharacters ?? [],
		gameCharacterUnits: e.gameCharacterUnits ?? [],
		gameCharacterUnit3dMotions: e.gameCharacterUnit3dMotions ?? []
	};
}
function Ye(e, t) {
	let n = (e) => e ?? [], r = n(e.character3ds).filter((e) => e.characterId === t), i = new Set(n(e.costume3ds).filter((e) => e.characterId === t).map((e) => e.id));
	for (let e of r) for (let t of [
		e.bodyCostume3dId,
		e.headCostume3dId,
		e.hairCostume3dId
	]) i.add(t);
	return {
		costume3ds: n(e.costume3ds).filter((e) => i.has(e.id)),
		costume3dModels: n(e.costume3dModels).filter((e) => i.has(e.costume3dId)),
		character3ds: r,
		costume3dModelNotAvailablePatterns: n(e.costume3dModelNotAvailablePatterns).filter((e) => i.has(e.headCostume3dId)),
		costume3dModelDefaultHairs: n(e.costume3dModelDefaultHairs).filter((e) => i.has(e.headCostume3dId))
	};
}
function Xe(e, t, n, r) {
	let i = t.character3ds.find((e) => e.id >= 1 && e.id <= 31 && e.characterId === n && e.unit === r);
	if (!i) throw Error(`character3ds has no CostumeShop role ${n}:${r ?? "default"}`);
	let a = e.gameCharacterUnits.find((e) => e.gameCharacterId === n && e.unit === r);
	if (!a) throw Error(`gameCharacterUnits is missing role ${n}/${r ?? "default"}`);
	let o = e.gameCharacters.find((e) => e.id === n)?.height;
	if (!o || o <= 0) throw Error(`gameCharacters has no height for ${n}`);
	return {
		roleId: i.id,
		characterId: n,
		characterHeightMeters: o > 10 ? Math.fround(o / 100) : o,
		unit: r,
		bodyCostume3dId: i.bodyCostume3dId,
		headCostume3dId: i.headCostume3dId,
		hairCostume3dId: i.hairCostume3dId,
		skinColors: {
			default: a.skinColorCode,
			shadow1: a.skinShadowColorCode1,
			shadow2: a.skinShadowColorCode2
		}
	};
}
function Ze(e, t, n, r, i) {
	let a = (e) => e.filter((e) => !e.unit || e.unit === r), o = {
		...e,
		...t,
		costume3dModels: a(t.costume3dModels),
		costume3dModelNotAvailablePatterns: a(t.costume3dModelNotAvailablePatterns),
		costume3dModelDefaultHairs: a(t.costume3dModelDefaultHairs)
	}, s = qe(o);
	return {
		masterVersion: e.version ?? "",
		role: Xe(e, t, n, r),
		units: Fe(e, n),
		motions: Pe(e, i),
		registry: Ge(o, i).filter((e) => e.characterId === n && (e.unit ?? null) === r),
		compatibility: s
	};
}
//#endregion
//#region src/original/unityFile.ts
var Qe = new TextDecoder("utf-8", { fatal: !0 });
function O(e, t) {
	if (!e) throw Error(t);
}
var $e = class {
	bytes;
	little;
	view;
	offset = 0;
	constructor(e, t = !1) {
		this.bytes = e, this.little = t, this.view = new DataView(e.buffer, e.byteOffset, e.byteLength);
	}
	ensure(e) {
		O(e >= 0 && this.offset + e <= this.bytes.length, "truncated Unity data");
	}
	take(e) {
		this.ensure(e);
		let t = this.bytes.subarray(this.offset, this.offset + e);
		return this.offset += e, t;
	}
	u8() {
		return this.ensure(1), this.bytes[this.offset++];
	}
	i8() {
		return this.ensure(1), this.view.getInt8(this.offset++);
	}
	u16() {
		this.ensure(2);
		let e = this.view.getUint16(this.offset, this.little);
		return this.offset += 2, e;
	}
	i16() {
		this.ensure(2);
		let e = this.view.getInt16(this.offset, this.little);
		return this.offset += 2, e;
	}
	u32() {
		this.ensure(4);
		let e = this.view.getUint32(this.offset, this.little);
		return this.offset += 4, e;
	}
	i32() {
		this.ensure(4);
		let e = this.view.getInt32(this.offset, this.little);
		return this.offset += 4, e;
	}
	i64() {
		this.ensure(8);
		let e = this.view.getBigInt64(this.offset, this.little);
		return this.offset += 8, e;
	}
	u64() {
		this.ensure(8);
		let e = this.view.getBigUint64(this.offset, this.little);
		return this.offset += 8, e;
	}
	f32() {
		this.ensure(4);
		let e = this.view.getFloat32(this.offset, this.little);
		return this.offset += 4, e;
	}
	f64() {
		this.ensure(8);
		let e = this.view.getFloat64(this.offset, this.little);
		return this.offset += 8, e;
	}
	align(e = 4) {
		let t = (e - this.offset % e) % e;
		this.ensure(t), this.offset += t;
	}
	cstring() {
		let e = this.bytes.indexOf(0, this.offset);
		O(e >= 0, "unterminated Unity string");
		let t = Qe.decode(this.bytes.subarray(this.offset, e));
		return this.offset = e + 1, t;
	}
	count(e = 2147483647) {
		let t = this.i32();
		return O(t >= 0 && t <= e, `invalid Unity array length ${t}`), t;
	}
};
function et(e, t) {
	return O(e >= 0n && e <= BigInt(2 ** 53 - 1), `${t} out of range`), Number(e);
}
function tt(e, t) {
	let n = new Uint8Array(t), r = 0, i = 0, a = e.length;
	for (; r < a;) {
		let o = e[r++], s = o >>> 4;
		if (s === 15) {
			let t;
			do
				t = e[r++], s += t;
			while (t === 255);
		}
		if (O(r + s <= a && i + s <= t, "LZ4 literal run out of range"), n.set(e.subarray(r, r + s), i), r += s, i += s, r >= a) break;
		let c = e[r] | e[r + 1] << 8;
		r += 2, O(c > 0 && c <= i, "invalid LZ4 match distance");
		let l = o & 15;
		if (l === 15) {
			let t;
			do
				t = e[r++], l += t;
			while (t === 255);
		}
		l += 4, O(i + l <= t, "LZ4 match out of range");
		let u = i - c;
		if (c >= l) n.copyWithin(i, u, u + l), i += l;
		else for (let e = 0; e < l; e++) n[i++] = n[u++];
	}
	return O(i === t, "LZ4 output size mismatch"), n;
}
function nt(e, t, n) {
	let r = n & 63;
	return r === 0 ? (O(e.length === t, "uncompressed UnityFS block size mismatch"), e) : (O(r === 2 || r === 3, `unsupported UnityFS block compression ${r}`), tt(e, t));
}
function rt(e) {
	let t = new $e(e);
	O(t.cstring() === "UnityFS", "not a UnityFS bundle");
	let n = t.u32();
	O(n === 8, `unsupported UnityFS version ${n}`);
	let r = t.cstring(), i = t.cstring();
	O(et(t.i64(), "UnityFS size") === e.length, "UnityFS size mismatch");
	let a = t.u32(), o = t.u32(), s = t.u32();
	t.align(16);
	let c = t.offset, l = (s & 128) != 0, u = l ? e.length - a : c, d = new $e(nt(e.subarray(u, u + a), o, s));
	d.take(16);
	let f = Array.from({ length: d.count(1 << 20) }, () => ({
		size: d.u32(),
		compressed: d.u32(),
		flags: d.u16()
	})), p = Array.from({ length: d.count(65536) }, () => ({
		offset: et(d.i64(), "node offset"),
		size: et(d.i64(), "node size"),
		flags: d.u32(),
		path: d.cstring()
	})), m = l ? c : u + a;
	s & 512 && (m = Math.ceil(m / 16) * 16);
	let h = f.reduce((e, t) => e + t.size, 0), g;
	if (f.every((e) => (e.flags & 63) == 0)) g = e.subarray(m, m + h), O(g.length === h, "truncated UnityFS data");
	else {
		g = new Uint8Array(h);
		let t = 0;
		for (let n of f) g.set(nt(e.subarray(m, m + n.compressed), n.size, n.flags), t), m += n.compressed, t += n.size;
	}
	let _ = /* @__PURE__ */ new Map();
	for (let e of p) O(e.offset + e.size <= g.length && !_.has(e.path), `invalid UnityFS node ${e.path}`), _.set(e.path, {
		path: e.path,
		flags: e.flags,
		bytes: g.subarray(e.offset, e.offset + e.size)
	});
	return {
		unityVersion: r,
		unityRevision: i,
		nodes: _
	};
}
var it = new TextEncoder().encode((/* @__PURE__ */ "AABB.AnimationClip.AnimationCurve.AnimationState.Array.Base.BitField.bitset.bool.char.ColorRGBA.Component.data.deque.double.dynamic_array.FastPropertyName.first.float.Font.GameObject.Generic Mono.GradientNEW.GUID.GUIStyle.int.list.long long.map.Matrix4x4f.MdFour.MonoBehaviour.MonoScript.m_ByteSize.m_Curve.m_EditorClassIdentifier.m_EditorHideFlags.m_Enabled.m_ExtensionPtr.m_GameObject.m_Index.m_IsArray.m_IsStatic.m_MetaFlag.m_Name.m_ObjectHideFlags.m_PrefabInternal.m_PrefabParentObject.m_Script.m_StaticEditorFlags.m_Type.m_Version.Object.pair.PPtr<Component>.PPtr<GameObject>.PPtr<Material>.PPtr<MonoBehaviour>.PPtr<MonoScript>.PPtr<Object>.PPtr<Prefab>.PPtr<Sprite>.PPtr<TextAsset>.PPtr<Texture>.PPtr<Texture2D>.PPtr<Transform>.Prefab.Quaternionf.Rectf.RectInt.RectOffset.second.set.short.size.SInt16.SInt32.SInt64.SInt8.staticvector.string.TextAsset.TextMesh.Texture.Texture2D.Transform.TypelessData.UInt16.UInt32.UInt64.UInt8.unsigned int.unsigned long long.unsigned short.vector.Vector2f.Vector3f.Vector4f.m_ScriptingClassIdentifier.Gradient.Type*.int2_storage.int3_storage.BoundsInt.m_CorrespondingSourceObject.m_PrefabInstance.m_PrefabAsset.FileSize.Hash128.RenderingLayerMask.fixed_array.EntityId.".split(".")).join("\0")), at = 16384;
function ot(e, t) {
	return (n, r, i) => {
		let a = e.BYTES_PER_ELEMENT;
		if (i) {
			let t = new ArrayBuffer(r * a);
			return new Uint8Array(t).set(n.subarray(0, r * a)), new e(t, 0, r);
		}
		let o = new DataView(n.buffer, n.byteOffset, r * a);
		return Array.from({ length: r }, (e, n) => t(o, n * a, !1));
	};
}
var st = (() => {
	let e = {
		size: 1,
		read: (e) => e.u8(),
		array: (e, t) => e.slice(0, t)
	}, t = {
		size: 1,
		read: (e) => e.u8() !== 0,
		array: (e, t) => Array.from(e.subarray(0, t), (e) => e !== 0)
	}, n = {
		size: 1,
		read: (e) => e.i8(),
		array: (e, t) => new Int8Array(e.slice(0, t).buffer)
	}, r = {
		size: 2,
		read: (e) => e.u16(),
		array: ot(Uint16Array, (e, t, n) => e.getUint16(t, n))
	}, i = {
		size: 2,
		read: (e) => e.i16(),
		array: ot(Int16Array, (e, t, n) => e.getInt16(t, n))
	}, a = {
		size: 4,
		read: (e) => e.u32(),
		array: ot(Uint32Array, (e, t, n) => e.getUint32(t, n))
	}, o = {
		size: 4,
		read: (e) => e.i32(),
		array: ot(Int32Array, (e, t, n) => e.getInt32(t, n))
	}, s = {
		size: 4,
		read: (e) => e.f32(),
		array: ot(Float32Array, (e, t, n) => e.getFloat32(t, n))
	}, c = {
		size: 8,
		read: (e) => e.f64(),
		array: ot(Float64Array, (e, t, n) => e.getFloat64(t, n))
	}, l = (e) => ({
		size: 8,
		read: (t) => e ? t.i64() : t.u64(),
		array: (t, n, r) => {
			let i = new DataView(t.buffer, t.byteOffset, n * 8);
			return Array.from({ length: n }, (t, n) => e ? i.getBigInt64(n * 8, r) : i.getBigUint64(n * 8, r));
		}
	});
	return {
		UInt8: e,
		char: e,
		bool: t,
		SInt8: n,
		UInt16: r,
		"unsigned short": r,
		SInt16: i,
		short: i,
		UInt32: a,
		"unsigned int": a,
		"Type*": a,
		SInt32: o,
		int: o,
		float: s,
		double: c,
		UInt64: l(!1),
		"unsigned long long": l(!1),
		FileSize: l(!1),
		SInt64: l(!0),
		"long long": l(!0)
	};
})();
function ct(e) {
	let t = (e.metaFlags & at) !== 0, n = (e, t) => t ? (t) => {
		let n = e(t);
		return t.align(), n;
	} : e, r = st[e.type];
	if (r && e.children.length === 0) return n(r.read, t);
	if (e.type === "string") return (e) => {
		let t = e.count(), n = Qe.decode(e.take(t));
		return e.align(), n;
	};
	if (e.type === "TypelessData") return n((e) => e.take(e.count()), t);
	let i = e.children[0];
	if (i && i.type === "Array") {
		O(i.children.length === 2, `invalid TypeTree array ${e.name}`);
		let r = i.children[1], a = t || (i.metaFlags & at) !== 0, o = st[r.type];
		if (o && r.children.length === 0 && (r.metaFlags & at) === 0) return n((e) => {
			let t = e.count(), n = e.take(t * o.size);
			return o.array(n, t, e.little);
		}, a);
		let s = ct(r);
		return n((e) => {
			let t = e.count();
			r.byteSize > 0 && e.ensure(t * r.byteSize);
			let n = Array(t);
			for (let r = 0; r < t; r++) n[r] = s(e);
			return n;
		}, a);
	}
	O(e.children.length > 0, `unsupported TypeTree leaf ${e.type} ${e.name}`);
	let a = e.children.map((e) => [e.name, ct(e)]);
	return n((e) => {
		let t = {};
		for (let [n, r] of a) t[n] = r(e);
		return t;
	}, t);
}
function lt(e) {
	let t = e.count(1 << 20), n = e.count(1 << 26);
	O(t > 0, "missing embedded TypeTree");
	let r = Array(t);
	for (let n = 0; n < t; n++) {
		e.u16();
		let t = e.u8();
		e.u8();
		let i = e.u32(), a = e.u32(), o = e.i32();
		e.i32();
		let s = e.i32();
		O(e.u64() === 0n, "managed-reference TypeTrees are not supported"), r[n] = {
			level: t,
			typeOffset: i,
			nameOffset: a,
			byteSize: o,
			metaFlags: s
		};
	}
	let i = e.take(n), a = (e) => {
		let t = (e & 2147483648) == 0, n = t ? i : it, r = t ? e : e & 2147483647, a = n.indexOf(0, r);
		return Qe.decode(n.subarray(r, a < 0 ? n.length : a));
	}, o = [], s = null;
	for (let e of r) {
		let t = {
			type: a(e.typeOffset),
			name: a(e.nameOffset),
			byteSize: e.byteSize,
			metaFlags: e.metaFlags,
			children: []
		};
		O(e.level <= o.length, "invalid TypeTree nesting"), o.length = e.level, e.level === 0 ? s = t : o[e.level - 1].children.push(t), o.push(t);
	}
	return s;
}
function ut(e) {
	let t = new $e(e);
	t.u32(), t.u32();
	let n = t.u32();
	t.u32(), O(n === 22, `unsupported SerializedFile version ${n}`);
	let r = t.u8();
	t.take(3);
	let i = t.u32(), a = et(t.i64(), "file size"), o = et(t.i64(), "data offset");
	t.i64(), O(a === e.length, "SerializedFile size mismatch"), t.little = r === 0;
	let s = t.cstring(), c = t.i32();
	O(t.u8() === 1, "SerializedFile without TypeTrees");
	let l = [];
	for (let e = t.count(65536); e > 0; e--) {
		let e = t.i32();
		t.u8();
		let n = t.i16();
		e === 114 && t.take(16), t.take(16);
		let r = lt(t);
		t.take(t.count(1 << 20) * 4), l.push({
			classId: e,
			typeName: r.type,
			scriptTypeIndex: n,
			read: ct(r)
		});
	}
	let u = /* @__PURE__ */ new Map(), d = t.little;
	for (let n = t.count(1 << 24); n > 0; n--) {
		t.align();
		let n = t.i64(), r = et(t.i64(), "object offset") + o, i = t.u32(), s = l[t.i32()];
		O(s && r + i <= a && !u.has(n), `invalid object entry ${n}`);
		let c;
		u.set(n, {
			pathId: n,
			classId: s.classId,
			typeName: s.typeName,
			scriptTypeIndex: s.scriptTypeIndex,
			byteStart: r,
			byteSize: i,
			read() {
				if (c === void 0) {
					let t = new $e(e.subarray(r, r + i), d);
					c = s.read(t), O(t.offset === i, `object ${n} (class ${s.classId}): ${i - t.offset} bytes unread`);
				}
				return c;
			}
		});
	}
	for (let e = t.count(1 << 20); e > 0; e--) t.i32(), t.align(), t.i64();
	let f = [];
	for (let e = t.count(65536); e > 0; e--) {
		t.cstring(), t.take(16);
		let e = t.i32();
		f.push({
			type: e,
			path: t.cstring()
		});
	}
	return O(t.count(65536) === 0, "SerializedFile reference types are not supported"), t.cstring(), O(t.offset === 48 + i, "SerializedFile metadata size mismatch"), {
		unityVersion: s,
		targetPlatform: c,
		objects: u,
		externals: f
	};
}
//#endregion
//#region src/original/unityBundle.ts
var k = /* @__PURE__ */ function(e) {
	return e[e.GameObject = 1] = "GameObject", e[e.Transform = 4] = "Transform", e[e.Material = 21] = "Material", e[e.MeshRenderer = 23] = "MeshRenderer", e[e.Texture2D = 28] = "Texture2D", e[e.MeshFilter = 33] = "MeshFilter", e[e.Mesh = 43] = "Mesh", e[e.Shader = 48] = "Shader", e[e.AnimationClip = 74] = "AnimationClip", e[e.Animator = 95] = "Animator", e[e.MonoBehaviour = 114] = "MonoBehaviour", e[e.MonoScript = 115] = "MonoScript", e[e.SkinnedMeshRenderer = 137] = "SkinnedMeshRenderer", e[e.AssetBundle = 142] = "AssetBundle", e;
}({});
function dt(e, t) {
	if (!e) throw Error(t);
}
var ft = class {
	name;
	serialized;
	streams = /* @__PURE__ */ new Map();
	pathCache = /* @__PURE__ */ new Map();
	assetBundle;
	cabName;
	size;
	constructor(e, t) {
		this.name = e;
		let n = rt(t);
		this.size = [...n.nodes.values()].reduce((e, t) => e + t.bytes.length, 0);
		let r = null, i = "";
		for (let t of n.nodes.values()) t.flags & 4 ? (dt(!r, `${e}: more than one SerializedFile`), r = ut(t.bytes), i = t.path) : this.streams.set(t.path, t.bytes);
		dt(r, `${e}: no SerializedFile`), this.serialized = r, this.cabName = i;
		let a = [...r.objects.values()].find((e) => e.classId === 142);
		dt(a, `${e}: no AssetBundle object`), this.assetBundle = a.read();
	}
	get objects() {
		return this.serialized.objects.values();
	}
	object(e) {
		return this.serialized.objects.get(e) ?? null;
	}
	local(e) {
		return !e || e.m_PathID === 0n || e.m_FileID !== 0 ? null : this.object(e.m_PathID);
	}
	read(e) {
		return this.local(e)?.read() ?? null;
	}
	externalCab(e) {
		let t = e > 0 ? this.serialized.externals[e - 1]?.path ?? null : null;
		return t ? t.split("/").pop() : null;
	}
	stream(e, t, n) {
		let r = e.split("/").pop(), i = this.streams.get(r);
		return dt(i, `${this.name}: stream ${e} not in bundle`), dt(t + n <= i.length, `${this.name}: stream range ${t}+${n} exceeds ${r}`), i.subarray(t, t + n);
	}
	resource(e, t) {
		let n = this.assetBundle.m_Container.filter((n) => {
			let r = this.local(n.second.asset);
			if (!r || r.classId !== 1 || r.read().m_Name.toLowerCase() !== e.toLowerCase()) return !1;
			let i = n.first.replace(/\\/g, "/"), a = /\/(fbx|sourceimages)\//i.test(i);
			return i.toLowerCase().endsWith(t.toLowerCase()) && !a;
		});
		dt(n.length === 1, `${this.name}: resource ${e} matches ${n.length} container entries ending in ${t}`);
		let r = n[0], i = this.local(r.second.asset), a = this.assetBundle.m_PreloadTable, o = Math.max(r.second.preloadIndex, 0), s = Math.min(o + Math.max(r.second.preloadSize, 0), a.length), c = [], l = /* @__PURE__ */ new Set();
		for (let e = o; e < s; e++) {
			let t = this.local(a[e]);
			t && !l.has(t.pathId) && (l.add(t.pathId), c.push(t));
		}
		return l.has(i.pathId) || c.push(i), {
			containerPath: r.first,
			root: i,
			objects: c
		};
	}
	transformPath(e) {
		let t = this.pathCache.get(e);
		if (t !== void 0) return t;
		let n = this.object(e)?.read(), r = n ? this.read(n.m_GameObject) : null, i;
		return i = !n || !r ? `transform:${e}` : this.local(n.m_Father) ? `${this.transformPath(n.m_Father.m_PathID)}/${r.m_Name}` : r.m_Name, this.pathCache.set(e, i), i;
	}
	gameObjectTransform(e) {
		for (let t of e.m_Component) {
			let e = this.local(t.component);
			if (e && e.classId === 4) return e.pathId;
		}
		return null;
	}
	script(e) {
		let t = this.read(e.m_Script);
		return t ? {
			name: t.m_ClassName || t.m_Name,
			namespace: t.m_Namespace ?? ""
		} : {
			name: `missing-script:${e.m_Script.m_PathID}`,
			namespace: ""
		};
	}
};
//#endregion
//#region src/original/originalTextures.ts
function pt(e, t) {
	if (!e) throw Error(t);
}
var mt = {
	48: 4,
	49: 5,
	50: 6,
	51: 8,
	52: 10,
	53: 12
}, ht = {
	4: y.RGBA_ASTC_4x4_Format,
	5: y.RGBA_ASTC_5x5_Format,
	6: y.RGBA_ASTC_6x6_Format,
	8: y.RGBA_ASTC_8x8_Format,
	10: y.RGBA_ASTC_10x10_Format,
	12: y.RGBA_ASTC_12x12_Format
}, gt = 7, _t = null;
async function vt(e) {
	return _t ||= (async () => {
		let t = e ?? await (await fetch("data:application/wasm;base64,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IBNBCGohEyAIQQhqIQggA0EIaiEDIA9BBGohDyABQQhqIQEgBUEBaiIFIA0oAgQgDSgCAGxIDQALDAELIA0oAgQgDSgCAGwhACANKAIQQQFMBEAgAEEATA0BQQAhDwNAIAEgAmogDSgCPCANKAJMIAIgDWpBvAFqIgAoAgAgDSgCJEECdEHgtghqKAIAEQAArSANKAJAIA0oAlAgACgCACANKAIkQQJ0QeC2CGooAgARAACtQhCGhCANKAJEIA0oAlQgACgCACANKAIkQQJ0QeC2CGooAgARAACtQiCGhCANKAJIIA0oAlggACgCACANKAIkQQJ0QaC3CGooAgARAACtQjCGhDcDACACQQhqIQIgD0EBaiIPIA0oAgQgDSgCAGxIDQALDAELIABBAEwNACANQTxqIQUgDUEkaiECQbwKIRMDQCABIANqIAUgDSATaigCACIAQQV0aiIHKAIAIAcoAhAgAyANakG8AWoiBigCACACIABBAnRqIgAoAgBBAnRB4LYIaigCABEAAK0gBygCBCAHKAIUIAYoAgAgACgCAEECdEHgtghqKAIAEQAArUIQhoQgBygCCCAHKAIYIAYoAgAgACgCAEECdEHgtghqKAIAEQAArUIghoQgBygCDCAHKAIcIAYoAgAgACgCAEECdEGgtwhqKAIAEQAArUIwhoQ3AwAgE0EEaiETIANBCGohAyAIQQFqIgggDSgCBCANKAIAbEgNAAsLIAlBEGokAAwBCyAdQQBMDQBBACEBICdFBEAgBCEAA0AgAEL//4OAcDcDACAAQThqQv//g4BwNwMAIABBMGpC//+DgHA3AwAgAEEoakL//4OAcDcDACAAQSBqQv//g4BwNwMAIABBGGpC//+DgHA3AwAgAEEQakL//4OAcDcDACAAQQhqQv//g4BwNwMAIABBQGshACAmIAFBCGoiAUcNAAsLIB5FDQAgBCABQQN0aiEAIB4hAQNAIABC//+DgHA3AwAgAEEIaiEAIAFBAWsiAQ0ACwsCQCAbQQBMIgANACAADQBBACEGIAQhAyAjIQIDQCAiIQAgAyEBIAIhCCAbIQUgBiAvaiArTg0BA0AgACAqSARAIAggASkDADcDACAAQQFqIQAgAUEIaiEBIAhBCGohCCAFQQFrIgUNAQsLIAMgJWohAyACIC1qIQIgBkEBaiIGIBtHDQALCyAbICJqISIgIyAlaiEjIA5BEGohDiAoQQFqIiggJEcNAAsgICAuaiEgICFBAWoiISAsRw0AC0HgwAgtAABBf3NBAXELIARBgBhqJAALC4o2WQBBhIAICwUBAAAAAgBBlIAICzUBAAAAAgAAAAEAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgBB1IAICyUBAAAAAgAAAAEAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEGEgQgLBQEAAAACAEGUgQgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEHUgQgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAABAAAAAAAAAAEAAAACAEGUgggLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEHUgggLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEGUgwgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEHUgwgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEGUhAgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEHUhAgLJQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQYSFCAsFAQAAAAIAQZSFCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQdSFCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAEAAAAAAAAAAQAAAAIAQZSGCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQdSGCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQZSHCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQdSHCAspAQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAQZCICAspAQAAAAEAAAABAAAAAAAAAAIAAAACAAAAAgAAAAAAAAACAAAAAgAAAAIAQcyICAshAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAABAEGQiQgLKQEAAAABAAAAAQAAAAAAAAACAAAAAgAAAAIAAAAAAAAAAgAAAAIAAAACAEHMiQgLLQEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAQBBkIoICykBAAAAAQAAAAEAAAAAAAAAAgAAAAIAAAACAAAAAAAAAAIAAAACAAAAAgBBzIoICy0BAAAAAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAgAAAAEAAAACAAAAAgAAAAIAQZCLCAspAQAAAAEAAAABAAAAAAAAAAIAAAACAAAAAgAAAAAAAAACAAAAAgAAAAIAQcyLCAstAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAABAAAAAgAAAAIAAAACAEGQjAgLKQEAAAABAAAAAQAAAAAAAAACAAAAAgAAAAIAAAAAAAAAAgAAAAIAAAACAEHMjAgLIQEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAQBB/IwICwEBAEGQjQgLKQEAAAABAAAAAQAAAAAAAAACAAAAAgAAAAIAAAAAAAAAAgAAAAIAAAACAEHMjQgLMQEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAQAAAAEAQZCOCAspAQAAAAEAAAABAAAAAAAAAAIAAAACAAAAAgAAAAAAAAACAAAAAgAAAAIAQcyOCAsxAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAABAAAAAgAAAAIAAAACAAAAAQBBkI8ICykBAAAAAQAAAAEAAAAAAAAAAgAAAAIAAAACAAAAAAAAAAIAAAACAAAAAgBBzI8ICzEBAAAAAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAgAAAAEAAAACAAAAAgAAAAIAAAABAEGMkAgLAQIAQZyQCAsBAgBBrJAIC0ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgBB/JAICwECAEGMkQgLAQIAQZyRCAsBAgBBrJEIC0ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgBB/JEICwECAEGMkggLAQIAQZySCAsBAgBBrJIIC0ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgBB/JIICwECAEGMkwgLAQIAQZyTCAsBAgBBrJMIC1ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAgAAAAIAQYyUCAsBAgBBnJQICwECAEGslAgLUQIAAAACAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgBBjJUICwECAEGclQgLAQIAQayVCAtRAgAAAAIAAAACAAAAAgAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAEGMlggLAQIAQZyWCAsBAgBBrJYIC1ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgAAAAEAAAABAAAAAQAAAAIAQYyXCAsBAgBBnJcICwECAEGslwgLUQIAAAACAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgBB8JgIC40CAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAQfCbCAsNAgAAAAIAAAACAAAAAgBB8JwIC40DAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAgBB8KAICw0CAAAAAgAAAAIAAAACAEHwoQgLDQIAAAACAAAAAgAAAAIAQfCiCAupBgIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAgAAAAIAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAAAAAAEAAAACAAAAAwAAAAQAAAAAAAAABAAAAAQAAAAAAAAAAQAAAAIAAAADAAAABAAAAAEAAAAEAAAABAAAAAAAAAABAAAAAgAAAAMAAAAEAAAAAgAAAAQAAAAEAAAAAAAAAAEAAAACAAAAAwAAAAQAAAADAAAABAAAAAQAAAAAAAAAAQAAAAIAAAADAAAABAAAAAAAAAAEAEGkqQgL7QEBAAAAAgAAAAMAAAAEAAAAAQAAAAQAAAABAAAAAAAAAAEAAAACAAAAAwAAAAQAAAACAAAABAAAAAIAAAAAAAAAAQAAAAIAAAADAAAABAAAAAMAAAAEAAAAAwAAAAAAAAABAAAAAgAAAAMAAAAEAAAAAAAAAAIAAAADAAAAAAAAAAEAAAACAAAAAwAAAAQAAAABAAAAAgAAAAMAAAAAAAAAAQAAAAIAAAADAAAABAAAAAIAAAACAAAAAwAAAAAAAAABAAAAAgAAAAMAAAAEAAAAAwAAAAIAAAADAAAAAAAAAAEAAAACAAAAAwAAAAQAQZyrCAthAQAAAAAAAAABAAAAAgAAAAMAAAAEAAAAAQAAAAAAAAABAAAAAAAAAAEAAAACAAAAAwAAAAQAAAACAAAAAAAAAAEAAAAAAAAAAQAAAAIAAAADAAAABAAAAAMAAAAAAAAAAQBBlKwIC2kEAAAABAAAAAQAAAABAAAAAQAAAAEAAAABAAAAAQAAAAQAAAAEAAAABAAAAAIAAAACAAAAAgAAAAIAAAACAAAABAAAAAQAAAAEAAAAAwAAAAMAAAADAAAAAwAAAAMAAAAEAAAABAAAAAQAQZStCAtpBAAAAAAAAAAEAAAAAQAAAAEAAAABAAAAAQAAAAEAAAAEAAAAAQAAAAQAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAACAAAABAAAAAMAAAADAAAAAwAAAAMAAAADAAAABAAAAAMAAAAEAEGUrggLAQQAQaCuCAtdAQAAAAEAAAABAAAAAQAAAAEAAAAEAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAACAAAAAgAAAAMAAAADAAAAAwAAAAMAAAADAAAABAAAAAMAAAADAEGUrwgLAQQAQaCvCAtdAQAAAAEAAAABAAAAAQAAAAEAAAAEAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAACAAAAAgAAAAMAAAADAAAAAwAAAAMAAAADAAAABAAAAAMAAAADAEGcsAgLAQQAQbiwCAsFAQAAAAQAQdiwCAsFAgAAAAQAQfiwCAuFAwMAAAAEAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAABAAAAAQAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAAEAAAABAAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAQAAAAEAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAABAAAAAQAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAAEAAAABAAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAAEAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAABAAAAAQAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAAEAAAABAAAAAMAAAADAAAAAwAAAAMAAAADAAAAAwAAAAQAAAAEAAAAAwAAAAMAAAADAAAAAwAAAAMAAAADAAAABAAAAAQAAAADAAAAAwAAAAMAAAADAAAAAwAAAAMAAAAEAAAABAAAAAMAAAADAAAAAwAAAAMA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")).arrayBuffer(), { instance: n } = await WebAssembly.instantiate(t, {}), r = n.exports;
		return { decode16(e, t, n, i) {
			let a = r.__heap_base.value, o = Math.ceil(a / 16) * 16, s = Math.ceil((o + e.length) / 16) * 16, c = s + t * n * 8;
			return c > r.memory.buffer.byteLength && r.memory.grow(Math.ceil((c - r.memory.buffer.byteLength) / 65536)), new Uint8Array(r.memory.buffer).set(e, o), pt(r.decode_rgba16(o, t, n, i, s) === 1, "ASTC decode failed (invalid or HDR block)"), new Uint16Array(r.memory.buffer, s, t * n * 4).slice();
		} };
	})(), _t;
}
function yt(e, t) {
	let n = e.object(t);
	pt(n && n.classId === k.Texture2D, `${e.name}: ${t} is not a Texture2D`);
	let r = n.read();
	pt(r.m_MipCount === 1, `${r.m_Name}: ${r.m_MipCount} mip levels (only single-level textures are expected)`);
	let i = r.m_StreamData.path ? e.stream(r.m_StreamData.path, Number(r.m_StreamData.offset), r.m_StreamData.size) : r["image data"];
	return pt(mt[r.m_TextureFormat] || r.m_TextureFormat === gt, `${r.m_Name}: texture format ${r.m_TextureFormat} is not supported`), {
		name: r.m_Name,
		width: r.m_Width,
		height: r.m_Height,
		format: r.m_TextureFormat,
		data: i.slice()
	};
}
function bt(e) {
	if (e === 65535) return 15360;
	if (e < 4) return e << 8;
	let t = Math.clz32(e) - 16;
	return (e * 2 ** (t + 1) & 65535) >> 6 | 14 - t << 10;
}
async function xt(e, t) {
	let { width: n, height: r, data: i } = e, a = mt[e.format], o;
	if (a) if (t.nativeAstc) o = new y.CompressedTexture([{
		data: i,
		width: n,
		height: r
	}], n, r, ht[a]);
	else {
		let e = (await vt()).decode16(i, n, r, a);
		for (let t = 0; t < e.length; t++) e[t] = bt(e[t]);
		o = new y.DataTexture(e, n, r, y.RGBAFormat, y.HalfFloatType);
	}
	else {
		pt(i.length === n * r * 2, `${e.name}: RGB565 size mismatch`);
		let t = new Uint16Array(i.buffer, i.byteOffset, n * r), a = new Uint16Array(t.length * 4);
		for (let e = 0; e < t.length; e++) {
			let n = t[e];
			a[e * 4] = y.DataUtils.toHalfFloat((n >> 11 & 31) / 31), a[e * 4 + 1] = y.DataUtils.toHalfFloat((n >> 5 & 63) / 63), a[e * 4 + 2] = y.DataUtils.toHalfFloat((n & 31) / 31), a[e * 4 + 3] = y.DataUtils.toHalfFloat(1);
		}
		o = new y.DataTexture(a, n, r, y.RGBAFormat, y.HalfFloatType);
	}
	return o.name = e.name, o.flipY = !1, o.generateMipmaps = !1, o.colorSpace = y.NoColorSpace, o.needsUpdate = !0, o;
}
var St = class {
	caps;
	payloads = /* @__PURE__ */ new Map();
	textures = /* @__PURE__ */ new Map();
	constructor(e) {
		this.caps = e;
	}
	register(e) {
		for (let [t, n] of Object.entries(e)) this.payloads.has(t) || this.payloads.set(t, n);
	}
	has(e) {
		return this.payloads.has(e);
	}
	loadAsync(e) {
		let t = this.textures.get(e);
		if (!t) {
			let n = this.payloads.get(e);
			pt(n, `original texture ${e} was not delivered with its part`), t = xt(n, this.caps), this.textures.set(e, t);
		}
		return t;
	}
	dispose() {
		for (let e of this.textures.values()) e.then((e) => e.dispose());
		this.textures.clear(), this.payloads.clear();
	}
}, Ct = null;
function wt(e) {
	return Ct ??= new St(e ?? { nativeAstc: !1 }), Ct;
}
function Tt(e) {
	return { nativeAstc: e.extensions.has("WEBGL_compressed_texture_astc") };
}
//#endregion
//#region src/original/originalContent.ts
async function Et(e, t) {
	if (e instanceof ArrayBuffer) return e;
	if (ArrayBuffer.isView(e)) return e.buffer.slice(e.byteOffset, e.byteOffset + e.byteLength);
	if (typeof Blob < "u" && e instanceof Blob) return e.arrayBuffer();
	let n = typeof Response < "u" && e instanceof Response ? e : await fetch(new URL(String(e), globalThis.location?.href), { signal: t });
	if (!n.ok) throw Error(`${n.url || String(e)}: HTTP ${n.status}`);
	return n.arrayBuffer();
}
//#endregion
//#region src/original/originalPartProvider.ts
var Dt = 1, Ot = class {
	content;
	id = Dt++;
	worker = null;
	nextId = 1;
	abort = new AbortController();
	pending = /* @__PURE__ */ new Map();
	built = /* @__PURE__ */ new Map();
	clipBundles = /* @__PURE__ */ new Map();
	roleIndexes = /* @__PURE__ */ new Map();
	masters = /* @__PURE__ */ new Map();
	inPlace = null;
	constructor(e) {
		this.content = e;
	}
	host = {
		catalog: async () => new Uint8Array(await Et(this.content.assetBundleInfo, this.abort.signal)),
		bundle: async (e, t) => {
			let n = this.abort.signal, r = await this.content.provideBundle(e, {
				version: t,
				signal: n
			});
			return new Uint8Array(await Et(r, n));
		}
	};
	build(e) {
		let t = e.bundlePath;
		if (!t) return Promise.reject(/* @__PURE__ */ Error(`registry entry ${e.costume3dId} has no bundle`));
		let n = e.partType, r = `${n}|${t}|${e.colorVariationBundlePath ?? ""}|${e.costume3dId}|${e.unit ?? ""}|${e.characterId}`, i = this.built.get(r);
		return i || (i = this.post({
			kind: "part",
			entry: e,
			partType: n,
			bundleName: t,
			colorBundleName: e.colorVariationBundlePath ?? null,
			attachNode: e.attachNode ?? null
		}).then((e) => {
			if (e.error) throw Error(`original part ${t}: ${e.error}`);
			return wt().register(e.textures ?? {}), e.runtime;
		}), this.built.set(r, i), i.catch(() => this.built.delete(r))), i;
	}
	clips(e) {
		let t = e.filter((e) => !this.clipBundles.has(e));
		if (t.length) {
			let e = this.post({
				kind: "clips",
				bundleNames: t
			}).then((e) => {
				if (e.error) throw Error(`original motion ${t.join(", ")}: ${e.error}`);
				return e.clips;
			});
			for (let n of t) {
				let t = e.then((e) => e[n] ?? null);
				this.clipBundles.set(n, t), t.catch(() => this.clipBundles.delete(n));
			}
		}
		return Promise.all(e.map(async (e) => [e, await this.clipBundles.get(e)])).then((e) => Object.fromEntries(e));
	}
	master(e) {
		let t = this.masters.get(e);
		return t || (t = Promise.resolve().then(() => this.content.provideMasterData(e)), this.masters.set(e, t), t.catch(() => this.masters.delete(e))), t;
	}
	async costumeSources(e) {
		let t = await this.master(e);
		return Array.isArray(t.costume3dSources) ? t.costume3dSources : [];
	}
	roleIndex(e, t) {
		let n = `${e}:${t ?? ""}`, r = this.roleIndexes.get(n);
		return r || (r = this.master(e).then((n) => {
			let r = n;
			return this.post({
				kind: "roleIndex",
				characterId: e,
				unit: t,
				common: Je(r),
				character: Ye(r, e)
			});
		}).then((e) => {
			if (e.error) throw Error(`role ${n}: ${e.error}`);
			return e.roleIndex;
		}), this.roleIndexes.set(n, r), r.catch(() => this.roleIndexes.delete(n))), r;
	}
	async model3DMotionBundleName(e, t, n) {
		let r = Je(await this.master(e)), i = await this.post({
			kind: "motionName",
			gameCharacterId: e,
			unit: t,
			motionType: n,
			common: r
		});
		if (i.error) throw Error(`motion of ${e}:${t ?? "default"} (${n}): ${i.error}`);
		return i.bundleName;
	}
	async post(e) {
		let t = {
			...e,
			contentId: this.id
		};
		if (typeof Worker > "u") {
			this.inPlace ??= import("./originalPartWorker-XtD1SPdN.js").then((e) => (e.registerOriginalHost(this.id, this.host), e));
			try {
				return {
					id: 0,
					...await (await this.inPlace).runOriginalWorkerRequest(t)
				};
			} catch (e) {
				return {
					id: 0,
					error: e instanceof Error ? e.message : String(e)
				};
			}
		}
		this.worker ??= this.createWorker();
		let n = this.nextId++;
		return new Promise((e, r) => {
			this.pending.set(n, {
				resolve: e,
				reject: r
			}), this.worker.postMessage({
				id: n,
				...t
			});
		});
	}
	async answer(e, t) {
		try {
			let n = t.what === "catalog" ? await this.host.catalog() : await this.host.bundle(t.element, t.version ?? ""), r = n.byteOffset === 0 && n.byteLength === n.buffer.byteLength ? n.buffer : n.slice().buffer;
			e.postMessage({
				hostResponse: t.hostRequest,
				bytes: r
			}, [r]);
		} catch (n) {
			e.postMessage({
				hostResponse: t.hostRequest,
				error: n instanceof Error ? n.message : String(n)
			});
		}
	}
	createWorker() {
		let e = new Worker(new URL(
			/* @vite-ignore */
			"" + new URL("assets/originalPartWorker-CQRd1cI3.js", import.meta.url).href,
			"" + import.meta.url
		), { type: "module" });
		return e.onmessage = (t) => {
			let n = t.data;
			if ("hostRequest" in n) {
				this.answer(e, n);
				return;
			}
			let r = this.pending.get(n.id);
			r && (this.pending.delete(n.id), r.resolve(n));
		}, e.onerror = (e) => {
			for (let t of this.pending.values()) t.reject(/* @__PURE__ */ Error(`original part worker: ${e.message}`));
			this.pending.clear();
		}, e;
	}
	dispose() {
		this.abort.abort(), this.worker?.terminate(), this.worker = null, this.inPlace?.then((e) => e.releaseOriginalContent(this.id)), this.inPlace = null, this.built.clear(), this.clipBundles.clear(), this.roleIndexes.clear(), this.masters.clear();
	}
}, kt = /* @__PURE__ */ new WeakMap();
function At(e) {
	let t = kt.get(e);
	return t || (t = new Ot(e), kt.set(e, t)), t;
}
//#endregion
//#region src/engine/sekaiExtraBoneRuntime.ts
var jt = Math.PI / 180, Mt = [
	"XYZ",
	"XZY",
	"YXZ",
	"YZX",
	"ZXY",
	"ZYX"
], Nt = class e {
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
		let r = Ft(t);
		if (!r.length) return null;
		n.updateMatrixWorld(!0);
		let i = zt(n), a = [];
		for (let e of r) {
			let t = e.GameObject ?? e.gameObject ?? null, n = e.ReferenceBone ?? e.referenceBone ?? null, r = Ht(i, Jt(t?.TransformPath ?? t?.transformPath), Jt(t?.Name ?? t?.name)), o = Ht(i, Jt(n?.TransformPath ?? n?.transformPath), Jt(n?.Name ?? n?.name));
			if (!r || !o) continue;
			let s = Mt[qt(e.RotationOrder ?? e.rotationOrder, 4)] ?? "ZXY";
			a.push({
				node: r,
				referenceNode: o,
				coefficient: qt(e.Coefficient ?? e.coefficient, 1),
				defaultQuaternion: It(e),
				axisX: Yt(e.AxisX ?? e.axisX, !0),
				axisY: Yt(e.AxisY ?? e.axisY, !0),
				axisZ: Yt(e.AxisZ ?? e.axisZ, !0),
				order: s
			});
		}
		return a.sort((e, t) => Wt(e.referenceNode) - Wt(t.referenceNode)), a.length ? new e(a) : null;
	}
	update() {
		for (let e of this.entries) {
			this.sourceUnityQuaternion.set(e.referenceNode.quaternion.x, -e.referenceNode.quaternion.y, -e.referenceNode.quaternion.z, e.referenceNode.quaternion.w).normalize(), this.sourceUnityEuler.setFromQuaternion(this.sourceUnityQuaternion, "YXZ"), Lt(this.sourceUnityEuler);
			let t = e.coefficient > 0 ? -1 : +(e.coefficient < 0);
			this.targetUnityEuler.set(0, 0, 0, e.order), e.axisX && (this.targetUnityEuler.x = this.sourceUnityEuler.x * t), e.axisY && (this.targetUnityEuler.y = this.sourceUnityEuler.y * t), e.axisZ && (this.targetUnityEuler.z = this.sourceUnityEuler.z * t), this.targetUnityQuaternion.setFromEuler(this.targetUnityEuler).invert(), this.targetQuaternion.copy(i(this.targetUnityQuaternion)), Pt(e.node.quaternion, e.defaultQuaternion, this.targetQuaternion, Math.abs(e.coefficient)), e.node.updateMatrix(), e.node.updateMatrixWorld(!0);
		}
	}
	getControlledTrackNodeNames() {
		return new Set(this.entries.map((e) => e.node.name).filter(Boolean));
	}
};
function Pt(e, t, n, r) {
	let i = y.MathUtils.clamp(r, 0, 1), a = t.dot(n) < 0 ? -1 : 1;
	return e.set(y.MathUtils.lerp(t.x, n.x * a, i), y.MathUtils.lerp(t.y, n.y * a, i), y.MathUtils.lerp(t.z, n.z * a, i), y.MathUtils.lerp(t.w, n.w * a, i)).normalize();
}
function Ft(e) {
	let t = Gt(Gt(Gt(e)?.pjskSpringBone)?.raw), n = [];
	for (let e of [t?.body, t?.head]) {
		let t = Gt(e)?.extraBones;
		Array.isArray(t) && n.push(...t.filter(Kt));
	}
	return n;
}
function It(e) {
	let t = Gt(e.DefaultEulerAngles ?? e.defaultEulerAngles) ?? {}, n = qt(t.X ?? t.x, 0), r = qt(t.Y ?? t.y, 0), a = qt(t.Z ?? t.z, 0);
	return i(new y.Quaternion().setFromEuler(new y.Euler(n * jt, r * jt, a * jt, "YXZ")));
}
function Lt(e) {
	return e.x = Rt(e.x), e.y = Rt(e.y), e.z = Rt(e.z), e;
}
function Rt(e) {
	let t = Math.PI * 2;
	return (e % t + t) % t;
}
function zt(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
	return e.traverse((r) => {
		if (r !== e) {
			let e = n.get(r.name) ?? [];
			e.push(r), n.set(r.name, e);
		}
		for (let n of Bt(e, r)) t.set(n, r);
	}), {
		nodeByPath: t,
		nodeByName: n
	};
}
function Bt(e, t) {
	let n = Vt(t, e);
	if (!n) return [];
	let r = [n];
	return n.startsWith("body/") && r.push(`sit_body/${n.slice(5)}`), r;
}
function Vt(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(r.name), r = r.parent;
	return n.join("/");
}
function Ht(e, t, n) {
	for (let n of Ut(t)) {
		let t = e.nodeByPath.get(n);
		if (t) return t;
	}
	return n ? e.nodeByName.get(n)?.[0] ?? null : null;
}
function Ut(e) {
	if (!e) return [];
	let t = [e];
	return e.startsWith("sit_body/") && t.push(`body/${e.slice(9)}`), t;
}
function Wt(e) {
	let t = 0, n = e.parent;
	for (; n;) t += 1, n = n.parent;
	return t;
}
function Gt(e) {
	return e && typeof e == "object" ? e : null;
}
function Kt(e) {
	return !!Gt(e);
}
function qt(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function Jt(e) {
	return typeof e == "string" ? e : null;
}
function Yt(e, t) {
	return typeof e == "boolean" ? e : typeof e == "number" ? e !== 0 : t;
}
//#endregion
//#region src/costume_shop/modelRenderStudio.ts
var A = Math.fround;
function Xt(e, t) {
	return Number.isNaN(e) ? t : Number.isNaN(t) ? e : Math.min(e, t);
}
function Zt(e, t) {
	return Number.isNaN(e) ? t : Number.isNaN(t) ? e : Math.max(e, t);
}
function Qt(e) {
	return e < 0 ? 0 : Xt(e, 1);
}
var j = {
	zoomDuration: A(.35),
	bottomLowerLimitPosition: A(.4),
	bottomUpperLimitPosition: A(.85),
	topLowerLimitPosition: A(1.25),
	topUpperLimitPosition: A(.85),
	nearZ: A(2.3),
	farZ: A(4.5),
	fov: 25
}, M = {
	localPosition: [
		0,
		A(1.35),
		A(1.17)
	],
	localRotation: [
		0,
		1,
		0,
		A(-1.8725350514614547e-7)
	],
	nearClipPlane: A(.01),
	farClipPlane: 100,
	textureWidth: 1024,
	textureHeight: 1024
};
function $t(e, t) {
	let [n, r, i, a] = e, [o, s, c, l] = t;
	return [
		A(A(A(A(a * o) + A(n * l)) + A(r * c)) - A(i * s)),
		A(A(A(A(a * s) + A(r * l)) + A(i * o)) - A(n * c)),
		A(A(A(A(a * c) + A(i * l)) + A(n * s)) - A(r * o)),
		A(A(A(A(a * l) - A(n * o)) - A(r * s)) - A(i * c))
	];
}
function en(e, t) {
	let [n, r, i, a] = e, o = A(2 * A(A(r * t[2]) - A(i * t[1]))), s = A(2 * A(A(i * t[0]) - A(n * t[2]))), c = A(2 * A(A(n * t[1]) - A(r * t[0])));
	return [
		A(A(t[0] + A(a * o)) + A(A(r * c) - A(i * s))),
		A(A(t[1] + A(a * s)) + A(A(i * o) - A(n * c))),
		A(A(t[2] + A(a * c)) + A(A(n * s) - A(r * o)))
	];
}
var tn = A(Math.PI / 180), nn = class {
	zoomValue = 0;
	zoomMoveValue = 1;
	moveValue = 0;
	zoomDurationRatio = 0;
	cameraSetting = null;
	fieldOfView = 50;
	cameraLocalPosition = [...M.localPosition];
	cameraLocalRotation = [...M.localRotation];
	cameraRootRotation = [
		0,
		0,
		0,
		1
	];
	initialize(e) {
		this.cameraSetting = e, this.fieldOfView = e.fov, this.cameraLocalPosition[1] = e.topLowerLimitPosition, this.zoom(0, this.zoomMoveValue, !0);
	}
	zoom(e, t, n) {
		let r = this.requireSetting(), i = A(this.zoomValue + e);
		this.zoomValue = i;
		let a = A(r.zoomDuration * Qt(A(i / r.zoomDuration)));
		if (this.zoomValue = a, !(a >= 0 || n)) return;
		this.zoomMoveValue = t, this.calculateCameraZoom(t, a);
		let o = Qt(A(this.zoomValue / r.zoomDuration));
		this.cameraLocalPosition[2] = A(r.nearZ + A(A(r.farZ - r.nearZ) * Zt(o, 0)));
	}
	calculateCameraZoom(e, t) {
		let n = this.requireSetting(), r = Qt(A(t / n.zoomDuration));
		this.zoomDurationRatio = r;
		let i = Zt(r, 0), a = A(n.bottomLowerLimitPosition + A(A(n.bottomUpperLimitPosition - n.bottomLowerLimitPosition) * i)), o = A(A(n.topLowerLimitPosition + A(A(n.topUpperLimitPosition - n.topLowerLimitPosition) * i)) - a), s = e >= 0 ? Xt(e, 1) : 0;
		this.cameraLocalPosition[1] = A(a + A(s * o));
	}
	moveVertical(e) {
		this.zoomDurationRatio < 1 && this.calculateCameraMovePosition(e);
	}
	calculateCameraMovePosition(e) {
		let t = this.cameraLocalPosition[1];
		this.moveValue = t;
		let n = this.requireSetting(), r = this.zoomDurationRatio < 0 ? 0 : Xt(this.zoomDurationRatio, 1), i = A(n.bottomLowerLimitPosition + A(A(n.bottomUpperLimitPosition - n.bottomLowerLimitPosition) * r)), a = A(n.topLowerLimitPosition + A(A(n.topUpperLimitPosition - n.topLowerLimitPosition) * r)), o = A(t + e), s = o < i ? i : o, c = s <= a ? s : a;
		this.moveValue = c;
		let l = 0;
		if (i !== a) {
			let e = A(A(c - i) / A(a - i));
			e >= 0 && (l = Xt(e, 1));
		}
		this.zoomMoveValue = l, this.cameraLocalPosition[1] = c;
	}
	rotate(e, t, n) {
		if (!n) return;
		let r = A(A(A(-e) * tn) * .5);
		this.cameraRootRotation = $t(this.cameraRootRotation, [
			0,
			A(Math.sin(r)),
			0,
			A(Math.cos(r))
		]);
	}
	cameraWorldPosition() {
		return en(this.cameraRootRotation, this.cameraLocalPosition);
	}
	cameraWorldRotation() {
		return $t(this.cameraRootRotation, this.cameraLocalRotation);
	}
	requireSetting() {
		if (!this.cameraSetting) throw Error("ModelRenderStudio camera is not initialized");
		return this.cameraSetting;
	}
}, rn = .46, an = 2.74, on = -.0245, sn = .765;
function cn(e) {
	switch (e) {
		case "studio":
		case "default":
		case "costume-viewer": return {
			preset: "studio",
			layout: "archive"
		};
		case "costume-shop": return {
			preset: "studio",
			layout: "costume-shop"
		};
		case "capture": return {
			preset: "capture",
			layout: "archive"
		};
		default: return null;
	}
}
function ln(e) {
	let t = e >= 1 ? 0 : Math.min(1, 1 / e - 1), n = y.MathUtils.lerp(j.bottomLowerLimitPosition, j.bottomUpperLimitPosition, t), r = y.MathUtils.lerp(j.topLowerLimitPosition, j.topUpperLimitPosition, t), i = j.nearZ * Math.tan(y.MathUtils.degToRad(j.fov / 2)), a = e > 1 ? i * (1 - 1 / e) : 0;
	return {
		min: n - a - r,
		max: a
	};
}
function un(e) {
	let t = e >= 1 ? 0 : Math.min(1, 1 / e - 1);
	return 2 * (y.MathUtils.lerp(j.nearZ, j.farZ, t) / Math.max(1, e)) * Math.tan(y.MathUtils.degToRad(j.fov / 2));
}
function dn(e, t = 0, n = 1.6) {
	let r = Number.isFinite(t) ? t : 0;
	if (e === "legacy-cloud") {
		let e = new y.Vector3(0, rn, 0), t = new y.Vector3(0, 0, an).applyAxisAngle(new y.Vector3(0, 1, 0), y.MathUtils.degToRad(r));
		return {
			target: e,
			position: e.clone().add(t),
			fov: j.fov,
			costumeShopState: null
		};
	}
	let i = e === "official-default" ? {
		cameraRootYawDegrees: r,
		zoomValue: 0,
		zoomMoveValue: 1
	} : {
		cameraRootYawDegrees: r,
		zoomValue: j.zoomDuration,
		zoomMoveValue: 0
	}, a = y.MathUtils.clamp(i.zoomValue, 0, j.zoomDuration), o = j.zoomDuration > 0 ? a / j.zoomDuration : 0, s = y.MathUtils.lerp(j.bottomLowerLimitPosition, j.bottomUpperLimitPosition, o), c = y.MathUtils.lerp(j.topLowerLimitPosition, j.topUpperLimitPosition, o), l = y.MathUtils.clamp(i.zoomMoveValue, 0, 1), u = e === "full-body" ? sn : y.MathUtils.lerp(s, c, l), d = y.MathUtils.lerp(j.nearZ, j.farZ, o), f = y.MathUtils.degToRad(i.cameraRootYawDegrees), p = new y.Vector3(0, u, d);
	return {
		target: new y.Vector3(0, u, 0),
		position: p.clone().applyAxisAngle(new y.Vector3(0, 1, 0), f),
		fov: j.fov,
		costumeShopState: {
			cameraRootYawDegrees: i.cameraRootYawDegrees,
			zoomValue: a,
			zoomMoveValue: l,
			zoomRatio: o,
			localCameraPosition: p,
			localCameraRotationYDegrees: 180
		}
	};
}
function fn(e, t, n, r) {
	let i = t.clone().sub(e).normalize(), a = new y.Vector3().crossVectors(i, new y.Vector3(0, 1, 0)).normalize().multiplyScalar(on * n * r);
	return {
		target: t.clone().add(a),
		position: e.clone().add(a)
	};
}
//#endregion
//#region src/materials/official/unityGlesProgram.ts
var pn = "#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1", mn = "#define UNITY_SUPPORTS_UNIFORM_LOCATION 1";
function hn(e) {
	let t = /^#version 300 es\n/;
	if (!t.test(e)) throw Error("official program does not start with #version 300 es");
	return e.replace(t, "").split(pn).join("#define HLSLCC_ENABLE_UNIFORM_BUFFERS 0").split(mn).join("#define UNITY_SUPPORTS_UNIFORM_LOCATION 0");
}
var gn = /^in\s+(lowp|mediump|highp)\s+(float|vec2|vec3|vec4|uvec4|ivec4)\s+(in_\w+)\s*;\s*$/gm;
function _n(e) {
	return [...e.matchAll(gn)].map((e) => ({
		precision: e[1],
		type: e[2],
		name: e[3]
	}));
}
function vn(e) {
	switch (e.name) {
		case "in_POSITION0": return "harukiUnityObjectFromMesh * vec4(transformed, 1.0)";
		case "in_NORMAL0": return "mat3(harukiUnityObjectFromMesh) * objectNormal";
		case "in_TANGENT0": return "vec4(mat3(harukiUnityObjectFromMesh) * objectTangent, tangent.w * harukiUnityTangentSign)";
		case "in_COLOR0": return "harukiVertexColor()";
		case "in_TEXCOORD0": return e.type === "vec2" ? "uv" : "vec4(uv, 0.0, 0.0)";
		case "in_TEXCOORD1": return e.type === "vec2" ? "uv1" : "vec4(uv1, 0.0, 0.0)";
		case "in_TEXCOORD2": return e.type === "vec2" ? "uv2" : "vec4(uv2, 0.0, 0.0)";
		default: throw Error(`unmapped official vertex input ${e.name}`);
	}
}
function yn(e, t) {
	let n = hn(e), r = _n(n);
	if (!r.some((e) => e.name === "in_POSITION0")) throw Error("official vertex stage without in_POSITION0");
	let i = n.match(/^void main\(\)$/gm) ?? [];
	if (i.length !== 1) throw Error(`official vertex stage has ${i.length} main()`);
	let a = n.replace(gn, (e, t, n, r) => `${t} ${n} ${r};`).replace(/^void main\(\)$/m, "void harukiOfficialMain()"), o = (e) => r.some((t) => t.name === e), s = t.morphTargets, c = [
		t.skinning ? "#define USE_SKINNING" : "",
		s ? "#define USE_MORPHTARGETS" : "",
		s && s.normals ? "#define USE_MORPHNORMALS" : "",
		o("in_TANGENT0") ? "#define USE_TANGENT" : "",
		s ? `#define MORPHTARGETS_COUNT ${s.count}` : "",
		s ? `#define MORPHTARGETS_TEXTURE_STRIDE ${s.stride}` : ""
	].filter(Boolean), l = y.ShaderChunk;
	return `${a}\n${[
		"",
		"// ---- Haruki skinning pre-pass (Three chunks) ----",
		...c,
		s ? "precision highp sampler2DArray;" : "",
		s?.tangents && o("in_TANGENT0") ? "uniform highp sampler2DArray harukiMorphTangentTexture;\nuniform ivec2 harukiMorphTangentTextureSize;" : "",
		"uniform highp mat4 harukiUnityObjectFromMesh;",
		"uniform highp float harukiUnityTangentSign;",
		"uniform highp float harukiHasVertexColor;",
		"in highp vec3 position;",
		o("in_NORMAL0") || o("in_TANGENT0") ? "in highp vec3 normal;" : "",
		o("in_TANGENT0") ? "in highp vec4 tangent;" : "",
		o("in_TEXCOORD0") ? "in highp vec2 uv;" : "",
		o("in_TEXCOORD1") ? "in highp vec2 uv1;" : "",
		o("in_TEXCOORD2") ? "in highp vec2 uv2;" : "",
		o("in_COLOR0") ? "in highp vec4 color;" : "",
		t.skinning ? "in highp vec4 skinIndex;\nin highp vec4 skinWeight;" : "",
		l.morphtarget_pars_vertex,
		l.skinning_pars_vertex,
		o("in_COLOR0") ? "highp vec4 harukiVertexColor() { return harukiHasVertexColor > 0.5 ? color : vec4(1.0); }" : "",
		"void main()",
		"{",
		"  vec3 transformed = vec3(position);",
		"  vec3 objectNormal = vec3(0.0, 1.0, 0.0);",
		o("in_NORMAL0") || o("in_TANGENT0") ? "  objectNormal = vec3(normal);" : "",
		o("in_TANGENT0") ? "  vec3 objectTangent = vec3(tangent.xyz);" : "",
		s ? l.morphnormal_vertex : "",
		s?.tangents && o("in_TANGENT0") ? [
			"  for (int i = 0; i < MORPHTARGETS_COUNT; i++) {",
			"    if (morphTargetInfluences[i] != 0.0) {",
			"      int y = gl_VertexID / harukiMorphTangentTextureSize.x;",
			"      int x = gl_VertexID - y * harukiMorphTangentTextureSize.x;",
			"      objectTangent += texelFetch(harukiMorphTangentTexture, ivec3(x, y, i), 0).xyz * morphTargetInfluences[i];",
			"    }",
			"  }"
		].join("\n") : "",
		s ? l.morphtarget_vertex : "",
		t.skinning ? l.skinbase_vertex : "",
		t.skinning ? l.skinnormal_vertex : "",
		t.skinning ? l.skinning_vertex : "",
		...r.map((e) => `  ${e.name} = ${vn(e)};`),
		"  harukiOfficialMain();",
		"}",
		""
	].filter((e) => e !== "").join("\n")}\n`;
}
function bn(e) {
	return hn(e);
}
//#endregion
//#region src/materials/official/officialUnityMaterial.ts
function xn(e, t) {
	let n = e.subShaders.find((e) => e.lod <= t);
	if (!n) throw Error(`${e.shader}: no SubShader within LOD ${t}`);
	return n;
}
function Sn(e, t) {
	let n = e.passes.filter((e) => e.name.toUpperCase() === t.toUpperCase());
	if (n.length !== 1) throw Error(`SubShader LOD ${e.lod}: ${n.length} passes named ${t}`);
	return n[0];
}
function Cn(e, t) {
	let n = new Set(e.keywordSpace), r = [...new Set(t)].filter((e) => n.has(e)).sort().join(" "), i = e.variants.find((e) => e.keywords.join(" ") === r);
	if (!i) throw Error(`${e.owner}/${e.name}: no official variant for [${r}]`);
	return i;
}
var wn = /^\s*(?:UNITY_LOCATION\(\d+\)\s+)?(?:uniform|UNITY_UNIFORM)\s+(?:(?:lowp|mediump|highp)\s+)?(\w+)\s+(\w+)(?:\[(\d+)\])?\s*;/gm;
function Tn(...e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) for (let e of n.matchAll(wn)) {
		let n = e[2];
		if (n.startsWith("Xhlslcc_Unused") || n.startsWith("harukiUnity") || n === "harukiHasVertexColor" || /^(bindMatrix|bindMatrixInverse|boneTexture|morphTarget\w*)$/.test(n)) continue;
		let r = {
			type: e[1],
			name: n,
			arraySize: e[3] ? Number(e[3]) : null
		}, i = t.get(n);
		if (i && (i.type !== r.type || i.arraySize !== r.arraySize)) throw Error(`uniform ${n} declared differently in the two stages`);
		t.set(n, r);
	}
	return [...t.values()];
}
var En = {
	float: 1,
	int: 1,
	vec2: 2,
	vec3: 3,
	vec4: 4,
	ivec2: 2,
	ivec3: 3,
	ivec4: 4
};
function Dn(e) {
	if (e.type.startsWith("sampler")) return null;
	let t = En[e.type];
	if (t === void 0) throw Error(`unsupported official uniform type ${e.type} ${e.name}`);
	if (e.arraySize !== null) return e.type.startsWith("i") ? new Int32Array(e.arraySize * t) : new Float32Array(e.arraySize * t);
	switch (e.type) {
		case "float":
		case "int": return 0;
		case "vec2": return new y.Vector2();
		case "vec3": return new y.Vector3();
		case "vec4": return new y.Vector4();
		default: return new Int32Array(t);
	}
}
var On = [
	y.ZeroFactor,
	y.OneFactor,
	y.DstColorFactor,
	y.SrcColorFactor,
	y.OneMinusDstColorFactor,
	y.SrcAlphaFactor,
	y.OneMinusSrcColorFactor,
	y.DstAlphaFactor,
	y.OneMinusDstAlphaFactor,
	y.SrcAlphaSaturateFactor,
	y.OneMinusSrcAlphaFactor
], kn = [
	y.AddEquation,
	y.SubtractEquation,
	y.ReverseSubtractEquation,
	y.MinEquation,
	y.MaxEquation
], An = [
	y.AlwaysDepth,
	y.NeverDepth,
	y.LessDepth,
	y.EqualDepth,
	y.LessEqualDepth,
	y.GreaterDepth,
	y.NotEqualDepth,
	y.GreaterEqualDepth,
	y.AlwaysDepth
], jn = [
	y.AlwaysStencilFunc,
	y.NeverStencilFunc,
	y.LessStencilFunc,
	y.EqualStencilFunc,
	y.LessEqualStencilFunc,
	y.GreaterStencilFunc,
	y.NotEqualStencilFunc,
	y.GreaterEqualStencilFunc,
	y.AlwaysStencilFunc
], Mn = [
	y.KeepStencilOp,
	y.ZeroStencilOp,
	y.ReplaceStencilOp,
	y.IncrementStencilOp,
	y.DecrementStencilOp,
	y.InvertStencilOp,
	y.IncrementWrapStencilOp,
	y.DecrementWrapStencilOp
];
function Nn(e, t, n) {
	if (!e.property) return e.value;
	let r = n.float(e.property);
	if (r !== null) return r;
	let i = t.properties.find((t) => t.name === e.property);
	if (i && typeof i.default == "number") return i.default;
	throw Error(`${t.shader}: state property ${e.property} has no value`);
}
function N(e, t, n) {
	let r = e[Math.trunc(t)];
	if (r === void 0) throw Error(`unsupported ${n} ${t}`);
	return r;
}
function Pn(e, t, n, r) {
	let i = n.state, a = (e) => Nn(e, t, r), o = a(i.culling);
	e.side = o === 0 ? y.DoubleSide : o === 1 ? y.BackSide : y.FrontSide;
	let s = a(i.zTest);
	e.depthTest = s !== 0, e.depthFunc = N(An, s, "ZTest"), e.depthWrite = a(i.zWrite) !== 0;
	let c = a(i.offsetFactor), l = a(i.offsetUnits);
	e.polygonOffset = c !== 0 || l !== 0, e.polygonOffsetFactor = c, e.polygonOffsetUnits = l, e.alphaToCoverage = a(i.alphaToMask) !== 0;
	let u = i.blend[0], d = a(u.srcBlend), f = a(u.destBlend), p = a(u.srcBlendAlpha), m = a(u.destBlendAlpha), h = a(u.blendOp), g = a(u.blendOpAlpha);
	d === 1 && f === 0 && p === 1 && m === 0 && h === 0 && g === 0 ? e.blending = y.NoBlending : (e.blending = y.CustomBlending, e.blendSrc = N(On, d, "blend factor"), e.blendDst = N(On, f, "blend factor"), e.blendSrcAlpha = N(On, p, "blend factor"), e.blendDstAlpha = N(On, m, "blend factor"), e.blendEquation = N(kn, h, "BlendOp"), e.blendEquationAlpha = N(kn, g, "BlendOp")), e.premultipliedAlpha = !1;
	let _ = a(u.colMask);
	if (e.colorWrite = _ !== 0, _ === 14) e.blending === y.NoBlending && (e.blending = y.CustomBlending, e.blendSrc = y.OneFactor, e.blendDst = y.ZeroFactor, e.blendEquation = y.AddEquation), e.blendSrcAlpha = y.ZeroFactor, e.blendDstAlpha = y.OneFactor, e.blendEquationAlpha = y.AddEquation;
	else if (_ !== 0 && _ !== 15) throw Error(`${n.owner}/${n.name}: partial ColorMask ${_} needs a per-channel mask`);
	let v = a(i.stencilOp.comp), b = a(i.stencilRef), x = a(i.stencilReadMask), S = a(i.stencilWriteMask), ee = a(i.stencilOp.pass), C = a(i.stencilOp.fail), w = a(i.stencilOp.zFail);
	e.stencilWrite = !(v === 8 && ee === 0 && C === 0 && w === 0) && v !== 0, e.stencilFunc = N(jn, v, "stencil Comp"), e.stencilRef = b, e.stencilFuncMask = x, e.stencilWriteMask = S, e.stencilZPass = N(Mn, ee, "stencil Pass"), e.stencilFail = N(Mn, C, "stencil Fail"), e.stencilZFail = N(Mn, w, "stencil ZFail");
}
function Fn(e, t, n, r, i) {
	let a = Cn(t, n), o = e.programs[a.program];
	if (!o) throw Error(`${t.owner}/${t.name}: program ${a.program} missing from the table`);
	let s = yn(o.vertex, r), c = bn(o.fragment), l = Tn(s, c), u = {
		harukiUnityObjectFromMesh: { value: new y.Matrix4() },
		harukiUnityTangentSign: { value: -1 },
		harukiHasVertexColor: { value: 0 }
	};
	for (let e of l) u[e.name] = { value: Dn(e) };
	let d = new y.RawShaderMaterial({
		name: `${t.owner}/${t.name}`,
		glslVersion: y.GLSL3,
		vertexShader: s,
		fragmentShader: c,
		uniforms: u
	});
	return Pn(d, e, t, i), {
		material: d,
		pass: t,
		variant: a,
		uniforms: l
	};
}
var In = {
	programs: /* @__PURE__ */ JSON.parse("{\"23e56577679923d4e76434da22277eddd1ef0dc40daa89682ca6fb0cac2be9de\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tmediump vec4 _TextureSampleAdd;\\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\\nin mediump vec4 vs_COLOR0;\\nin highp vec2 vs_TEXCOORD0;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nvec4 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nvec4 u_xlat1;\\nmediump vec4 u_xlat16_1;\\nvoid main()\\n{\\n    u_xlat16_0.x = vs_COLOR0.w * 255.0;\\n    u_xlat16_0.x = roundEven(u_xlat16_0.x);\\n    u_xlat16_0.w = u_xlat16_0.x * 0.00392156886;\\n    u_xlat16_1 = texture(_MainTex, vs_TEXCOORD0.xy);\\n    u_xlat1 = u_xlat16_1 + _TextureSampleAdd;\\n    u_xlat16_0.xyz = vs_COLOR0.xyz;\\n    u_xlat0 = u_xlat16_0 * u_xlat1;\\n    SV_Target0.xyz = u_xlat0.www * u_xlat0.xyz;\\n    SV_Target0.w = u_xlat0.w;\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ScreenParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_ObjectToWorld[4];\\nuniform \\tvec4 hlslcc_mtx4x4glstate_matrix_projection[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tmediump vec4 _Color;\\nuniform \\tvec4 _ClipRect;\\nuniform \\tvec4 _MainTex_ST;\\nuniform \\tfloat _UIMaskSoftnessX;\\nuniform \\tfloat _UIMaskSoftnessY;\\nin highp vec4 in_POSITION0;\\nin highp vec4 in_COLOR0;\\nin highp vec2 in_TEXCOORD0;\\nout mediump vec4 vs_COLOR0;\\nout highp vec2 vs_TEXCOORD0;\\nout highp vec4 vs_TEXCOORD1;\\nout highp vec4 vs_TEXCOORD2;\\nvec4 u_xlat0;\\nvec4 u_xlat1;\\nvoid main()\\n{\\n    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];\\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat0.wwww + u_xlat1;\\n    gl_Position = u_xlat0;\\n    u_xlat1 = in_COLOR0 * _Color;\\n    vs_COLOR0 = u_xlat1;\\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    vs_TEXCOORD1 = in_POSITION0;\\n    u_xlat0.xy = _ScreenParams.yy * hlslcc_mtx4x4glstate_matrix_projection[1].xy;\\n    u_xlat0.xy = hlslcc_mtx4x4glstate_matrix_projection[0].xy * _ScreenParams.xx + u_xlat0.xy;\\n    u_xlat0.xy = u_xlat0.ww / abs(u_xlat0.xy);\\n    u_xlat0.xy = vec2(_UIMaskSoftnessX, _UIMaskSoftnessY) * vec2(0.25, 0.25) + abs(u_xlat0.xy);\\n    vs_TEXCOORD2.zw = vec2(0.25, 0.25) / u_xlat0.xy;\\n    u_xlat0 = max(_ClipRect, vec4(-2e+10, -2e+10, -2e+10, -2e+10));\\n    u_xlat0 = min(u_xlat0, vec4(2e+10, 2e+10, 2e+10, 2e+10));\\n    u_xlat0.xy = in_POSITION0.xy * vec2(2.0, 2.0) + (-u_xlat0.xy);\\n    vs_TEXCOORD2.xy = (-u_xlat0.zw) + u_xlat0.xy;\\n    return;\\n}\\n\\n\"},\"874129697aab9aee5f3170bf13bfcacc070925db72e936742eb9b01238095908\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tmediump vec4 _TextureSampleAdd;\\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\\nin mediump vec4 vs_COLOR0;\\nin highp vec2 vs_TEXCOORD0;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nvec4 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nvec4 u_xlat1;\\nmediump vec4 u_xlat16_1;\\nmediump float u_xlat16_2;\\nbool u_xlatb3;\\nvoid main()\\n{\\n    u_xlat16_0.x = vs_COLOR0.w * 255.0;\\n    u_xlat16_0.x = roundEven(u_xlat16_0.x);\\n    u_xlat16_0.w = u_xlat16_0.x * 0.00392156886;\\n    u_xlat16_1 = texture(_MainTex, vs_TEXCOORD0.xy);\\n    u_xlat1 = u_xlat16_1 + _TextureSampleAdd;\\n    u_xlat16_2 = u_xlat16_0.w * u_xlat1.w + -0.00100000005;\\n    u_xlatb3 = u_xlat16_2<0.0;\\n    if(u_xlatb3){discard;}\\n    u_xlat16_0.xyz = vs_COLOR0.xyz;\\n    u_xlat0 = u_xlat16_0 * u_xlat1;\\n    SV_Target0.xyz = u_xlat0.www * u_xlat0.xyz;\\n    SV_Target0.w = u_xlat0.w;\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ScreenParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_ObjectToWorld[4];\\nuniform \\tvec4 hlslcc_mtx4x4glstate_matrix_projection[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tmediump vec4 _Color;\\nuniform \\tvec4 _ClipRect;\\nuniform \\tvec4 _MainTex_ST;\\nuniform \\tfloat _UIMaskSoftnessX;\\nuniform \\tfloat _UIMaskSoftnessY;\\nin highp vec4 in_POSITION0;\\nin highp vec4 in_COLOR0;\\nin highp vec2 in_TEXCOORD0;\\nout mediump vec4 vs_COLOR0;\\nout highp vec2 vs_TEXCOORD0;\\nout highp vec4 vs_TEXCOORD1;\\nout highp vec4 vs_TEXCOORD2;\\nvec4 u_xlat0;\\nvec4 u_xlat1;\\nvoid main()\\n{\\n    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];\\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat0.wwww + u_xlat1;\\n    gl_Position = u_xlat0;\\n    u_xlat1 = in_COLOR0 * _Color;\\n    vs_COLOR0 = u_xlat1;\\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    vs_TEXCOORD1 = in_POSITION0;\\n    u_xlat0.xy = _ScreenParams.yy * hlslcc_mtx4x4glstate_matrix_projection[1].xy;\\n    u_xlat0.xy = hlslcc_mtx4x4glstate_matrix_projection[0].xy * _ScreenParams.xx + u_xlat0.xy;\\n    u_xlat0.xy = u_xlat0.ww / abs(u_xlat0.xy);\\n    u_xlat0.xy = vec2(_UIMaskSoftnessX, _UIMaskSoftnessY) * vec2(0.25, 0.25) + abs(u_xlat0.xy);\\n    vs_TEXCOORD2.zw = vec2(0.25, 0.25) / u_xlat0.xy;\\n    u_xlat0 = max(_ClipRect, vec4(-2e+10, -2e+10, -2e+10, -2e+10));\\n    u_xlat0 = min(u_xlat0, vec4(2e+10, 2e+10, 2e+10, 2e+10));\\n    u_xlat0.xy = in_POSITION0.xy * vec2(2.0, 2.0) + (-u_xlat0.xy);\\n    vs_TEXCOORD2.xy = (-u_xlat0.zw) + u_xlat0.xy;\\n    return;\\n}\\n\\n\"},\"b875c005045cb4b3732d47272a7cfc463db6bb91acdcc62f197eea11b0612e6b\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tmediump vec4 _TextureSampleAdd;\\nuniform \\tvec4 _ClipRect;\\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\\nin mediump vec4 vs_COLOR0;\\nin highp vec2 vs_TEXCOORD0;\\nin highp vec4 vs_TEXCOORD2;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nvec4 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nvec4 u_xlat1;\\nmediump vec4 u_xlat16_1;\\nbool u_xlatb1;\\nmediump float u_xlat16_2;\\nmediump float u_xlat16_5;\\nvoid main()\\n{\\n    u_xlat16_0.x = vs_COLOR0.w * 255.0;\\n    u_xlat16_0.x = roundEven(u_xlat16_0.x);\\n    u_xlat16_0.w = u_xlat16_0.x * 0.00392156886;\\n    u_xlat16_1 = texture(_MainTex, vs_TEXCOORD0.xy);\\n    u_xlat1 = u_xlat16_1 + _TextureSampleAdd;\\n    u_xlat16_0.xyz = vs_COLOR0.xyz;\\n    u_xlat0 = u_xlat16_0 * u_xlat1;\\n    u_xlat1.xy = (-_ClipRect.xy) + _ClipRect.zw;\\n    u_xlat1.xy = u_xlat1.xy + -abs(vs_TEXCOORD2.xy);\\n    u_xlat1.xy = u_xlat1.xy * vs_TEXCOORD2.zw;\\n    u_xlat1.xy = clamp(u_xlat1.xy, 0.0, 1.0);\\n    u_xlat16_2 = u_xlat1.y * u_xlat1.x;\\n    u_xlat16_5 = u_xlat0.w * u_xlat16_2 + -0.00100000005;\\n    u_xlat16_2 = u_xlat0.w * u_xlat16_2;\\n    SV_Target0.xyz = u_xlat0.xyz * vec3(u_xlat16_2);\\n    SV_Target0.w = u_xlat16_2;\\n    u_xlatb1 = u_xlat16_5<0.0;\\n    if(u_xlatb1){discard;}\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ScreenParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_ObjectToWorld[4];\\nuniform \\tvec4 hlslcc_mtx4x4glstate_matrix_projection[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tmediump vec4 _Color;\\nuniform \\tvec4 _ClipRect;\\nuniform \\tvec4 _MainTex_ST;\\nuniform \\tfloat _UIMaskSoftnessX;\\nuniform \\tfloat _UIMaskSoftnessY;\\nin highp vec4 in_POSITION0;\\nin highp vec4 in_COLOR0;\\nin highp vec2 in_TEXCOORD0;\\nout mediump vec4 vs_COLOR0;\\nout highp vec2 vs_TEXCOORD0;\\nout highp vec4 vs_TEXCOORD1;\\nout highp vec4 vs_TEXCOORD2;\\nvec4 u_xlat0;\\nvec4 u_xlat1;\\nvoid main()\\n{\\n    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];\\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat0.wwww + u_xlat1;\\n    gl_Position = u_xlat0;\\n    u_xlat1 = in_COLOR0 * _Color;\\n    vs_COLOR0 = u_xlat1;\\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    vs_TEXCOORD1 = in_POSITION0;\\n    u_xlat0.xy = _ScreenParams.yy * hlslcc_mtx4x4glstate_matrix_projection[1].xy;\\n    u_xlat0.xy = hlslcc_mtx4x4glstate_matrix_projection[0].xy * _ScreenParams.xx + u_xlat0.xy;\\n    u_xlat0.xy = u_xlat0.ww / abs(u_xlat0.xy);\\n    u_xlat0.xy = vec2(_UIMaskSoftnessX, _UIMaskSoftnessY) * vec2(0.25, 0.25) + abs(u_xlat0.xy);\\n    vs_TEXCOORD2.zw = vec2(0.25, 0.25) / u_xlat0.xy;\\n    u_xlat0 = max(_ClipRect, vec4(-2e+10, -2e+10, -2e+10, -2e+10));\\n    u_xlat0 = min(u_xlat0, vec4(2e+10, 2e+10, 2e+10, 2e+10));\\n    u_xlat0.xy = in_POSITION0.xy * vec2(2.0, 2.0) + (-u_xlat0.xy);\\n    vs_TEXCOORD2.xy = (-u_xlat0.zw) + u_xlat0.xy;\\n    return;\\n}\\n\\n\"},\"be6a8cb8eb12ea1e0ca2da97d7329ec93a4f7c3c35505846a6bf8f7ff4b96978\":{\"fragment\":\"#version 300 es\\n\\nprecision highp float;\\nprecision highp int;\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tmediump vec4 _TextureSampleAdd;\\nuniform \\tvec4 _ClipRect;\\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\\nin mediump vec4 vs_COLOR0;\\nin highp vec2 vs_TEXCOORD0;\\nin highp vec4 vs_TEXCOORD2;\\nlayout(location = 0) out mediump vec4 SV_Target0;\\nvec4 u_xlat0;\\nmediump vec4 u_xlat16_0;\\nmediump float u_xlat16_1;\\nvec4 u_xlat2;\\nmediump vec4 u_xlat16_2;\\nmediump float u_xlat16_4;\\nvoid main()\\n{\\n    u_xlat0.xy = (-_ClipRect.xy) + _ClipRect.zw;\\n    u_xlat0.xy = u_xlat0.xy + -abs(vs_TEXCOORD2.xy);\\n    u_xlat0.xy = u_xlat0.xy * vs_TEXCOORD2.zw;\\n    u_xlat0.xy = clamp(u_xlat0.xy, 0.0, 1.0);\\n    u_xlat16_1 = u_xlat0.y * u_xlat0.x;\\n    u_xlat16_4 = vs_COLOR0.w * 255.0;\\n    u_xlat16_4 = roundEven(u_xlat16_4);\\n    u_xlat16_0.w = u_xlat16_4 * 0.00392156886;\\n    u_xlat16_2 = texture(_MainTex, vs_TEXCOORD0.xy);\\n    u_xlat2 = u_xlat16_2 + _TextureSampleAdd;\\n    u_xlat16_0.xyz = vs_COLOR0.xyz;\\n    u_xlat0 = u_xlat16_0 * u_xlat2;\\n    u_xlat16_1 = u_xlat16_1 * u_xlat0.w;\\n    SV_Target0.xyz = u_xlat0.xyz * vec3(u_xlat16_1);\\n    SV_Target0.w = u_xlat16_1;\\n    return;\\n}\\n\\n\",\"vertex\":\"#version 300 es\\n\\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\\n#define UNITY_UNIFORM\\n#else\\n#define UNITY_UNIFORM uniform\\n#endif\\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\\n#define UNITY_LOCATION(x) layout(location = x)\\n#define UNITY_BINDING(x) layout(binding = x, std140)\\n#else\\n#define UNITY_LOCATION(x)\\n#define UNITY_BINDING(x) layout(std140)\\n#endif\\nuniform \\tvec4 _ScreenParams;\\nuniform \\tvec4 hlslcc_mtx4x4unity_ObjectToWorld[4];\\nuniform \\tvec4 hlslcc_mtx4x4glstate_matrix_projection[4];\\nuniform \\tvec4 hlslcc_mtx4x4unity_MatrixVP[4];\\nuniform \\tmediump vec4 _Color;\\nuniform \\tvec4 _ClipRect;\\nuniform \\tvec4 _MainTex_ST;\\nuniform \\tfloat _UIMaskSoftnessX;\\nuniform \\tfloat _UIMaskSoftnessY;\\nin highp vec4 in_POSITION0;\\nin highp vec4 in_COLOR0;\\nin highp vec2 in_TEXCOORD0;\\nout mediump vec4 vs_COLOR0;\\nout highp vec2 vs_TEXCOORD0;\\nout highp vec4 vs_TEXCOORD1;\\nout highp vec4 vs_TEXCOORD2;\\nvec4 u_xlat0;\\nvec4 u_xlat1;\\nvoid main()\\n{\\n    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;\\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;\\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];\\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\\n    u_xlat0 = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat0.wwww + u_xlat1;\\n    gl_Position = u_xlat0;\\n    u_xlat1 = in_COLOR0 * _Color;\\n    vs_COLOR0 = u_xlat1;\\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\\n    vs_TEXCOORD1 = in_POSITION0;\\n    u_xlat0.xy = _ScreenParams.yy * hlslcc_mtx4x4glstate_matrix_projection[1].xy;\\n    u_xlat0.xy = hlslcc_mtx4x4glstate_matrix_projection[0].xy * _ScreenParams.xx + u_xlat0.xy;\\n    u_xlat0.xy = u_xlat0.ww / abs(u_xlat0.xy);\\n    u_xlat0.xy = vec2(_UIMaskSoftnessX, _UIMaskSoftnessY) * vec2(0.25, 0.25) + abs(u_xlat0.xy);\\n    vs_TEXCOORD2.zw = vec2(0.25, 0.25) / u_xlat0.xy;\\n    u_xlat0 = max(_ClipRect, vec4(-2e+10, -2e+10, -2e+10, -2e+10));\\n    u_xlat0 = min(u_xlat0, vec4(2e+10, 2e+10, 2e+10, 2e+10));\\n    u_xlat0.xy = in_POSITION0.xy * vec2(2.0, 2.0) + (-u_xlat0.xy);\\n    vs_TEXCOORD2.xy = (-u_xlat0.zw) + u_xlat0.xy;\\n    return;\\n}\\n\\n\"}}"),
	properties: [
		{
			default: {
				dimension: 2,
				name: "white"
			},
			flags: 2,
			name: "_MainTex",
			type: 4
		},
		{
			default: [
				1,
				1,
				1,
				1
			],
			flags: 0,
			name: "_Color",
			type: 0
		},
		{
			default: 8,
			flags: 0,
			name: "_StencilComp",
			type: 2
		},
		{
			default: 0,
			flags: 0,
			name: "_Stencil",
			type: 2
		},
		{
			default: 0,
			flags: 0,
			name: "_StencilOp",
			type: 2
		},
		{
			default: 255,
			flags: 0,
			name: "_StencilWriteMask",
			type: 2
		},
		{
			default: 255,
			flags: 0,
			name: "_StencilReadMask",
			type: 2
		},
		{
			default: 15,
			flags: 0,
			name: "_ColorMask",
			type: 2
		},
		{
			default: 0,
			flags: 0,
			name: "_UseUIAlphaClip",
			type: 2
		}
	],
	shader: "UI/Default",
	subShaders: [{
		lod: 0,
		passes: [{
			keywordSpace: ["UNITY_UI_ALPHACLIP", "UNITY_UI_CLIP_RECT"],
			name: "Default",
			owner: "UI/Default",
			state: {
				alphaToMask: {
					property: null,
					value: 0
				},
				blend: [
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: "_ColorMask",
							value: 0
						},
						destBlend: {
							property: null,
							value: 10
						},
						destBlendAlpha: {
							property: null,
							value: 10
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					}
				],
				conservative: {
					property: null,
					value: 0
				},
				culling: {
					property: null,
					value: 0
				},
				offsetFactor: {
					property: null,
					value: 0
				},
				offsetUnits: {
					property: null,
					value: 0
				},
				separateBlend: !1,
				stencilOp: {
					comp: {
						property: "_StencilComp",
						value: 0
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: "_StencilOp",
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpBack: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpFront: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilReadMask: {
					property: "_StencilReadMask",
					value: 0
				},
				stencilRef: {
					property: "_Stencil",
					value: 0
				},
				stencilWriteMask: {
					property: "_StencilWriteMask",
					value: 0
				},
				zClip: {
					property: null,
					value: 1
				},
				zTest: {
					property: "unity_GUIZTestMode",
					value: 0
				},
				zWrite: {
					property: null,
					value: 0
				}
			},
			tags: {
				CanUseSpriteAtlas: "true",
				IGNOREPROJECTOR: "true",
				PreviewType: "Plane",
				QUEUE: "Transparent",
				RenderType: "Transparent"
			},
			variants: [
				{
					keywords: [],
					program: "23e56577679923d4e76434da22277eddd1ef0dc40daa89682ca6fb0cac2be9de",
					shaderRequirements: 1
				},
				{
					keywords: ["UNITY_UI_ALPHACLIP"],
					program: "874129697aab9aee5f3170bf13bfcacc070925db72e936742eb9b01238095908",
					shaderRequirements: 1
				},
				{
					keywords: ["UNITY_UI_CLIP_RECT"],
					program: "be6a8cb8eb12ea1e0ca2da97d7329ec93a4f7c3c35505846a6bf8f7ff4b96978",
					shaderRequirements: 1
				},
				{
					keywords: ["UNITY_UI_ALPHACLIP", "UNITY_UI_CLIP_RECT"],
					program: "b875c005045cb4b3732d47272a7cfc463db6bb91acdcc62f197eea11b0612e6b",
					shaderRequirements: 1
				}
			]
		}],
		tags: {
			CanUseSpriteAtlas: "true",
			IGNOREPROJECTOR: "true",
			PreviewType: "Plane",
			QUEUE: "Transparent",
			RenderType: "Transparent"
		}
	}]
}, Ln = {
	programs: { f622ed2d0f0e50c8f78bf11f593dee9c653ddf4d7fc60b41712b8ab0cf72dec2: {
		fragment: "#version 300 es\n\nprecision highp float;\nprecision highp int;\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n#define UNITY_UNIFORM\n#else\n#define UNITY_UNIFORM uniform\n#endif\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\n#define UNITY_LOCATION(x) layout(location = x)\n#define UNITY_BINDING(x) layout(binding = x, std140)\n#else\n#define UNITY_LOCATION(x)\n#define UNITY_BINDING(x) layout(std140)\n#endif\nuniform 	vec4 _ClipRect;\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\nin mediump vec4 vs_COLOR0;\nin mediump vec2 vs_TEXCOORD0;\nin highp vec4 vs_TEXCOORD1;\nlayout(location = 0) out mediump vec4 SV_Target0;\nvec4 u_xlat0;\nbvec4 u_xlatb0;\nvec4 u_xlat1;\nmediump vec4 u_xlat16_1;\nvoid main()\n{\n    u_xlatb0.xy = greaterThanEqual(vs_TEXCOORD1.xyxx, _ClipRect.xyxx).xy;\n    u_xlatb0.zw = greaterThanEqual(_ClipRect.zzzw, vs_TEXCOORD1.xxxy).zw;\n    u_xlat0.x = u_xlatb0.x ? float(1.0) : 0.0;\n    u_xlat0.y = u_xlatb0.y ? float(1.0) : 0.0;\n    u_xlat0.z = u_xlatb0.z ? float(1.0) : 0.0;\n    u_xlat0.w = u_xlatb0.w ? float(1.0) : 0.0;\n;\n    u_xlat0.xy = u_xlat0.zw * u_xlat0.xy;\n    u_xlat0.x = u_xlat0.y * u_xlat0.x;\n    u_xlat16_1 = texture(_MainTex, vs_TEXCOORD0.xy);\n    u_xlat1 = u_xlat16_1 * vs_COLOR0;\n    u_xlat1.w = u_xlat0.x * u_xlat1.w;\n    SV_Target0 = u_xlat1;\n    return;\n}\n\n",
		vertex: "#version 300 es\n\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n#define UNITY_UNIFORM\n#else\n#define UNITY_UNIFORM uniform\n#endif\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\n#define UNITY_LOCATION(x) layout(location = x)\n#define UNITY_BINDING(x) layout(binding = x, std140)\n#else\n#define UNITY_LOCATION(x)\n#define UNITY_BINDING(x) layout(std140)\n#endif\nuniform 	vec4 hlslcc_mtx4x4unity_ObjectToWorld[4];\nuniform 	vec4 hlslcc_mtx4x4unity_MatrixVP[4];\nuniform 	mediump vec4 _Color;\nuniform 	vec4 _MainTex_ST;\nin highp vec4 in_POSITION0;\nin highp vec4 in_COLOR0;\nin highp vec2 in_TEXCOORD0;\nout mediump vec4 vs_COLOR0;\nout mediump vec2 vs_TEXCOORD0;\nout highp vec4 vs_TEXCOORD1;\nvec4 u_xlat0;\nvec4 u_xlat1;\nvoid main()\n{\n    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\n    gl_Position = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat0.wwww + u_xlat1;\n    u_xlat0 = in_COLOR0 * _Color;\n    vs_COLOR0 = u_xlat0;\n    u_xlat0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\n    vs_TEXCOORD0.xy = u_xlat0.xy;\n    vs_TEXCOORD1 = in_POSITION0;\n    return;\n}\n\n"
	} },
	properties: [
		{
			default: {
				dimension: 2,
				name: "white"
			},
			flags: 0,
			name: "_MainTex",
			type: 4
		},
		{
			default: [
				1,
				1,
				1,
				1
			],
			flags: 0,
			name: "_Color",
			type: 0
		},
		{
			default: 8,
			flags: 0,
			name: "_StencilComp",
			type: 2
		},
		{
			default: 0,
			flags: 0,
			name: "_Stencil",
			type: 2
		},
		{
			default: 0,
			flags: 0,
			name: "_StencilOp",
			type: 2
		},
		{
			default: 255,
			flags: 0,
			name: "_StencilWriteMask",
			type: 2
		},
		{
			default: 255,
			flags: 0,
			name: "_StencilReadMask",
			type: 2
		},
		{
			default: 15,
			flags: 0,
			name: "_ColorMask",
			type: 2
		},
		{
			default: [
				-32767,
				-32767,
				32767,
				32767
			],
			flags: 0,
			name: "_ClipRect",
			type: 1
		}
	],
	shader: "Sekai/Particles/UI-Default",
	subShaders: [{
		lod: 0,
		passes: [{
			keywordSpace: [],
			name: "",
			owner: "Sekai/Particles/UI-Default",
			state: {
				alphaToMask: {
					property: null,
					value: 0
				},
				blend: [
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: "_ColorMask",
							value: 0
						},
						destBlend: {
							property: null,
							value: 10
						},
						destBlendAlpha: {
							property: null,
							value: 10
						},
						srcBlend: {
							property: null,
							value: 5
						},
						srcBlendAlpha: {
							property: null,
							value: 5
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					}
				],
				conservative: {
					property: null,
					value: 0
				},
				culling: {
					property: null,
					value: 0
				},
				offsetFactor: {
					property: null,
					value: 0
				},
				offsetUnits: {
					property: null,
					value: 0
				},
				separateBlend: !1,
				stencilOp: {
					comp: {
						property: "_StencilComp",
						value: 0
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: "_StencilOp",
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpBack: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpFront: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilReadMask: {
					property: "_StencilReadMask",
					value: 0
				},
				stencilRef: {
					property: "_Stencil",
					value: 0
				},
				stencilWriteMask: {
					property: "_StencilWriteMask",
					value: 0
				},
				zClip: {
					property: null,
					value: 1
				},
				zTest: {
					property: "unity_GUIZTestMode",
					value: 0
				},
				zWrite: {
					property: null,
					value: 0
				}
			},
			tags: {
				CanUseSpriteAtlas: "true",
				IGNOREPROJECTOR: "true",
				PreviewType: "Plane",
				QUEUE: "Transparent",
				RenderType: "Transparent"
			},
			variants: [{
				keywords: [],
				program: "f622ed2d0f0e50c8f78bf11f593dee9c653ddf4d7fc60b41712b8ab0cf72dec2",
				shaderRequirements: 33
			}]
		}],
		tags: {
			CanUseSpriteAtlas: "true",
			IGNOREPROJECTOR: "true",
			PreviewType: "Plane",
			QUEUE: "Transparent",
			RenderType: "Transparent"
		}
	}]
}, Rn = {
	programs: {
		aeebd7e8d1a3d29033cf1a035b98a4e69ae796a719c4742a751aa4fca9786dc9: {
			fragment: "#version 300 es\n\nprecision highp float;\nprecision highp int;\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n#define UNITY_UNIFORM\n#else\n#define UNITY_UNIFORM uniform\n#endif\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\n#define UNITY_LOCATION(x) layout(location = x)\n#define UNITY_BINDING(x) layout(binding = x, std140)\n#else\n#define UNITY_LOCATION(x)\n#define UNITY_BINDING(x) layout(std140)\n#endif\nuniform 	vec2 _GlobalMipBias;\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\nin mediump vec4 vs_COLOR0;\nin highp vec2 vs_TEXCOORD0;\nlayout(location = 0) out mediump vec4 SV_Target0;\nvec4 u_xlat0;\nmediump vec4 u_xlat16_0;\nvoid main()\n{\n    u_xlat16_0 = texture(_MainTex, vs_TEXCOORD0.xy, _GlobalMipBias.x);\n    u_xlat0 = u_xlat16_0 * vs_COLOR0;\n    SV_Target0 = u_xlat0;\n    return;\n}\n\n",
			vertex: "#version 300 es\n\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n#define UNITY_UNIFORM\n#else\n#define UNITY_UNIFORM uniform\n#endif\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\n#define UNITY_LOCATION(x) layout(location = x)\n#define UNITY_BINDING(x) layout(binding = x, std140)\n#else\n#define UNITY_LOCATION(x)\n#define UNITY_BINDING(x) layout(std140)\n#endif\nuniform 	vec4 hlslcc_mtx4x4unity_MatrixVP[4];\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\nUNITY_BINDING(0) uniform UnityPerDraw {\n#endif\n	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_WorldToObject[4];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n};\n#endif\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\nUNITY_BINDING(1) uniform UnityPerMaterial {\n#endif\n	UNITY_UNIFORM vec4                _MainTex_ST;\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n};\n#endif\nin highp vec4 in_POSITION0;\nin mediump vec4 in_COLOR0;\nin highp vec3 in_TEXCOORD0;\nout mediump vec4 vs_COLOR0;\nout highp vec2 vs_TEXCOORD0;\nvec4 u_xlat0;\nvec4 u_xlat1;\nvoid main()\n{\n    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\n    gl_Position = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat0.wwww + u_xlat1;\n    vs_COLOR0 = in_COLOR0;\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\n    return;\n}\n\n"
		},
		f2f13b8dd42b2304de7febd2acae6a76f4a651d5d0c4f7cc21b77a3704c5a07a: {
			fragment: "#version 300 es\n\nprecision highp float;\nprecision highp int;\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n#define UNITY_UNIFORM\n#else\n#define UNITY_UNIFORM uniform\n#endif\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\n#define UNITY_LOCATION(x) layout(location = x)\n#define UNITY_BINDING(x) layout(binding = x, std140)\n#else\n#define UNITY_LOCATION(x)\n#define UNITY_BINDING(x) layout(std140)\n#endif\nuniform 	vec2 _GlobalMipBias;\nUNITY_LOCATION(0) uniform mediump sampler2D _MainTex;\nin mediump vec4 vs_COLOR0;\nin highp vec2 vs_TEXCOORD0;\nlayout(location = 0) out mediump vec4 SV_Target0;\nlayout(location = 1) out mediump vec4 SV_Target1;\nlayout(location = 2) out mediump vec4 SV_Target2;\nvec4 u_xlat0;\nmediump vec4 u_xlat16_0;\nvoid main()\n{\n    u_xlat16_0 = texture(_MainTex, vs_TEXCOORD0.xy, _GlobalMipBias.x);\n    u_xlat0 = u_xlat16_0 * vs_COLOR0;\n    SV_Target0 = u_xlat0;\n    SV_Target1 = vec4(0.0, 0.0, 0.0, 1.0);\n    SV_Target2 = vec4(0.0, 0.0, 0.0, 1.0);\n    return;\n}\n\n",
			vertex: "#version 300 es\n\n#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n#define UNITY_UNIFORM\n#else\n#define UNITY_UNIFORM uniform\n#endif\n#define UNITY_SUPPORTS_UNIFORM_LOCATION 1\n#if UNITY_SUPPORTS_UNIFORM_LOCATION\n#define UNITY_LOCATION(x) layout(location = x)\n#define UNITY_BINDING(x) layout(binding = x, std140)\n#else\n#define UNITY_LOCATION(x)\n#define UNITY_BINDING(x) layout(std140)\n#endif\nuniform 	vec4 hlslcc_mtx4x4unity_MatrixVP[4];\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\nUNITY_BINDING(0) uniform UnityPerDraw {\n#endif\n	UNITY_UNIFORM vec4                hlslcc_mtx4x4unity_ObjectToWorld[4];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_WorldToObject[4];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LODFade;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_WorldTransformParams;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RenderingLayer;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightData;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_LightIndices[2];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_ProbesOcclusion;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube0_HDR;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SpecCube1_HDR;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMax;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_BoxMin;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube0_ProbePosition;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMax;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_BoxMin;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_SpecCube1_ProbePosition;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_LightmapST;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_DynamicLightmapST;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAr;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAg;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHAb;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBr;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBg;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHBb;\n	UNITY_UNIFORM mediump vec4 Xhlslcc_UnusedXunity_SHC;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Min;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_RendererBounds_Max;\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousM[4];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXhlslcc_mtx4x4unity_MatrixPreviousMI[4];\n	UNITY_UNIFORM vec4 Xhlslcc_UnusedXunity_MotionVectorsParams;\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n};\n#endif\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\nUNITY_BINDING(1) uniform UnityPerMaterial {\n#endif\n	UNITY_UNIFORM vec4                _MainTex_ST;\n#if HLSLCC_ENABLE_UNIFORM_BUFFERS\n};\n#endif\nin highp vec4 in_POSITION0;\nin mediump vec4 in_COLOR0;\nin highp vec3 in_TEXCOORD0;\nout mediump vec4 vs_COLOR0;\nout highp vec2 vs_TEXCOORD0;\nvec4 u_xlat0;\nvec4 u_xlat1;\nvoid main()\n{\n    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;\n    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;\n    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];\n    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;\n    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;\n    gl_Position = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat0.wwww + u_xlat1;\n    vs_COLOR0 = in_COLOR0;\n    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;\n    return;\n}\n\n"
		}
	},
	properties: [
		{
			default: {
				dimension: 2,
				name: "white"
			},
			flags: 0,
			name: "_MainTex",
			type: 4
		},
		{
			default: 8,
			flags: 0,
			name: "_StencilComp",
			type: 2
		},
		{
			default: 0,
			flags: 0,
			name: "_Stencil",
			type: 2
		},
		{
			default: 0,
			flags: 0,
			name: "_StencilOp",
			type: 2
		},
		{
			default: 255,
			flags: 0,
			name: "_StencilWriteMask",
			type: 2
		},
		{
			default: 255,
			flags: 0,
			name: "_StencilReadMask",
			type: 2
		}
	],
	shader: "Sekai/Particles/UI/Additive",
	subShaders: [{
		lod: 0,
		passes: [{
			keywordSpace: [],
			name: "",
			owner: "Sekai/Particles/UI/Additive",
			state: {
				alphaToMask: {
					property: null,
					value: 0
				},
				blend: [
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 14
						},
						destBlend: {
							property: null,
							value: 1
						},
						destBlendAlpha: {
							property: null,
							value: 1
						},
						srcBlend: {
							property: null,
							value: 5
						},
						srcBlendAlpha: {
							property: null,
							value: 5
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					}
				],
				conservative: {
					property: null,
					value: 0
				},
				culling: {
					property: null,
					value: 0
				},
				offsetFactor: {
					property: null,
					value: 0
				},
				offsetUnits: {
					property: null,
					value: 0
				},
				separateBlend: !1,
				stencilOp: {
					comp: {
						property: "_StencilComp",
						value: 0
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: "_StencilOp",
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpBack: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpFront: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilReadMask: {
					property: "_StencilReadMask",
					value: 0
				},
				stencilRef: {
					property: "_Stencil",
					value: 0
				},
				stencilWriteMask: {
					property: "_StencilWriteMask",
					value: 0
				},
				zClip: {
					property: null,
					value: 1
				},
				zTest: {
					property: null,
					value: 8
				},
				zWrite: {
					property: null,
					value: 0
				}
			},
			tags: {
				IGNOREPROJECTOR: "true",
				PreviewType: "Plane",
				QUEUE: "Transparent",
				RenderType: "Transparent"
			},
			variants: [{
				keywords: [],
				program: "f2f13b8dd42b2304de7febd2acae6a76f4a651d5d0c4f7cc21b77a3704c5a07a",
				shaderRequirements: 227
			}]
		}, {
			keywordSpace: [],
			name: "",
			owner: "Sekai/Particles/UI/Additive",
			state: {
				alphaToMask: {
					property: null,
					value: 0
				},
				blend: [
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 14
						},
						destBlend: {
							property: null,
							value: 1
						},
						destBlendAlpha: {
							property: null,
							value: 1
						},
						srcBlend: {
							property: null,
							value: 5
						},
						srcBlendAlpha: {
							property: null,
							value: 5
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					},
					{
						blendOp: {
							property: null,
							value: 0
						},
						blendOpAlpha: {
							property: null,
							value: 0
						},
						colMask: {
							property: null,
							value: 15
						},
						destBlend: {
							property: null,
							value: 0
						},
						destBlendAlpha: {
							property: null,
							value: 0
						},
						srcBlend: {
							property: null,
							value: 1
						},
						srcBlendAlpha: {
							property: null,
							value: 1
						}
					}
				],
				conservative: {
					property: null,
					value: 0
				},
				culling: {
					property: null,
					value: 0
				},
				offsetFactor: {
					property: null,
					value: 0
				},
				offsetUnits: {
					property: null,
					value: 0
				},
				separateBlend: !1,
				stencilOp: {
					comp: {
						property: "_StencilComp",
						value: 0
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: "_StencilOp",
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpBack: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilOpFront: {
					comp: {
						property: null,
						value: 8
					},
					fail: {
						property: null,
						value: 0
					},
					pass: {
						property: null,
						value: 0
					},
					zFail: {
						property: null,
						value: 0
					}
				},
				stencilReadMask: {
					property: "_StencilReadMask",
					value: 0
				},
				stencilRef: {
					property: "_Stencil",
					value: 0
				},
				stencilWriteMask: {
					property: "_StencilWriteMask",
					value: 0
				},
				zClip: {
					property: null,
					value: 1
				},
				zTest: {
					property: null,
					value: 8
				},
				zWrite: {
					property: null,
					value: 0
				}
			},
			tags: {
				IGNOREPROJECTOR: "true",
				LIGHTMODE: "SekaiUI",
				PreviewType: "Plane",
				QUEUE: "Transparent",
				RenderType: "Transparent"
			},
			variants: [{
				keywords: [],
				program: "aeebd7e8d1a3d29033cf1a035b98a4e69ae796a719c4742a751aa4fca9786dc9",
				shaderRequirements: 227
			}]
		}],
		tags: {
			IGNOREPROJECTOR: "true",
			PreviewType: "Plane",
			QUEUE: "Transparent",
			RenderType: "Transparent"
		}
	}]
}, zn = 1 / 65535, Bn = {
	panelSize: [759.5499877929688, 647.280029296875],
	backgroundSize: [2338, 1440],
	particleScale: 100,
	tri: {
		duration: 6,
		rate: 8,
		lifetime: [6, 7],
		speed: [.5, 2.200000047683716],
		size: [1, 5],
		startRotation: [-6.283185005187988, 6.283185005187988],
		angularVelocityXY: [-.6108652353286743, .6108652353286743],
		angularVelocityZ: [-1.570796251296997, 1.570796251296997],
		radius: 2.0999999046325684,
		radiusThickness: .7599999904632568,
		sizeCurve: [[
			0,
			.1817779541015625,
			0,
			0
		], [
			1,
			1,
			.3526337146759033,
			.3526337146759033
		]],
		alphaKeys: [
			[0, 0],
			[6168 * zn, 1],
			[54548 * zn, 1],
			[1, 0]
		],
		frameRange: [0, .9998999834060669],
		tiles: [2, 2]
	},
	flare: {
		duration: 5,
		lifetime: 5,
		size: 15,
		sizeMultiplier: 2,
		offset: [0, -3.4200000762939453],
		sizeCurve: [
			[
				0,
				.6434060335159302,
				0,
				0
			],
			[
				.617828369140625,
				.8837184906005859,
				.7115257382392883,
				.7115257382392883
			],
			[
				1,
				1,
				0,
				0
			]
		],
		color: [
			.16078431904315948,
			.22817322611808777,
			.9137254953384399
		],
		alphaKeys: [
			[0, 0],
			[11565 * zn, 1],
			[23708 * zn, 1],
			[1, 0]
		],
		startFrame: .5,
		tiles: [2, 2]
	}
}, Vn = 1 / 60;
function Hn(e, t) {
	let n = e[0], r = e[e.length - 1];
	if (t <= n[0]) return n[1];
	if (t >= r[0]) return r[1];
	let i = 0;
	for (; t > e[i + 1][0];) i++;
	let [a, o, , s] = e[i], [c, l, u] = e[i + 1], d = c - a, f = (t - a) / d, p = f * f, m = p * f;
	return (2 * m - 3 * p + 1) * o + (m - 2 * p + f) * d * s + (-2 * m + 3 * p) * l + (m - p) * d * u;
}
function Un(e, t) {
	if (t <= e[0][0]) return e[0][1];
	for (let n = 1; n < e.length; n++) {
		let [r, i] = e[n];
		if (t <= r) {
			let [a, o] = e[n - 1];
			return o + (i - o) * (t - a) / (r - a);
		}
	}
	return e[e.length - 1][1];
}
function Wn(e, t) {
	return Math.min(Math.floor(e * t[0] * t[1]), t[0] * t[1] - 1);
}
function Gn(e) {
	let t = e >>> 0;
	return () => {
		t = t + 1831565813 >>> 0;
		let e = t;
		return e = Math.imul(e ^ e >>> 15, e | 1), e ^= e + Math.imul(e ^ e >>> 7, e | 61), ((e ^ e >>> 14) >>> 0) / 4294967296;
	};
}
var Kn = class {
	tri = [];
	flareAge = 0;
	emission = 0;
	random;
	constructor(e = 1) {
		this.random = Gn(e);
	}
	between(e) {
		return e[0] + (e[1] - e[0]) * this.random();
	}
	step(e) {
		let t = Bn.tri;
		for (let t = 0; t < this.tri.length;) {
			let n = this.tri[t];
			if (n.age += e, n.age >= n.lifetime) {
				this.tri[t] = this.tri[this.tri.length - 1], this.tri.pop();
				continue;
			}
			n.x += n.vx * e, n.y += n.vy * e;
			for (let t = 0; t < 3; t++) n.rotation[t] += n.angularVelocity[t] * e;
			t++;
		}
		for (this.emission += t.rate * e; this.emission >= 1;) {
			--this.emission;
			let e = this.emission / t.rate, n = 1 - t.radiusThickness, r = t.radius * Math.sqrt(n * n + (1 - n * n) * this.random()), i = this.random() * Math.PI * 2, a = Math.cos(i), o = -Math.sin(i), s = this.between(t.speed);
			this.tri.push({
				x: a * (r + s * e),
				y: o * (r + s * e),
				vx: a * s,
				vy: o * s,
				startSize: this.between(t.size),
				lifetime: this.between(t.lifetime),
				age: e,
				rotation: [
					this.between(t.startRotation),
					this.between(t.startRotation),
					this.between(t.startRotation)
				],
				angularVelocity: [
					this.between(t.angularVelocityXY),
					this.between(t.angularVelocityXY),
					this.between(t.angularVelocityZ)
				],
				frame: Wn(this.between(t.frameRange), t.tiles)
			});
		}
		this.flareAge = (this.flareAge + e) % Bn.flare.duration;
	}
	prewarm() {
		for (let e = 0; e < Bn.tri.duration; e += Vn) this.step(Vn);
		this.flareAge = 0;
	}
};
function qn(e, t, n) {
	let r = e.programs[Cn(t, []).program];
	if (!r) throw Error(`${e.shader}: program missing from the table`);
	let i = new y.RawShaderMaterial({
		name: e.shader,
		glslVersion: y.GLSL3,
		vertexShader: hn(r.vertex),
		fragmentShader: hn(r.fragment),
		uniforms: n
	});
	return Pn(i, e, t, {
		float: (e) => e === "unity_GUIZTestMode" ? 8 : e === "_ColorMask" ? 15 : null,
		color: () => null
	}), i;
}
function Jn(e, t = 0) {
	return xn(e, 300).passes[t];
}
function Yn(e) {
	let t = [];
	for (let n = 0; n < e; n++) t.push(n * 4, n * 4 + 1, n * 4 + 2, n * 4 + 2, n * 4 + 3, n * 4);
	return t;
}
function Xn(e, t) {
	return [e % t[0] / t[0], 1 - (Math.floor(e / t[0]) + 1) / t[1]];
}
var Zn = [
	[-.5, -.5],
	[-.5, .5],
	[.5, .5],
	[.5, -.5]
];
async function Qn(e) {
	let t = new y.TextureLoader(), n = async (n, r, i) => {
		let a = await t.loadAsync(new URL(`ui/archive-background/${n}`, e).toString());
		return a.colorSpace = y.NoColorSpace, a.generateMipmaps = i, a.minFilter = i ? y.LinearMipmapNearestFilter : y.LinearFilter, a.magFilter = y.LinearFilter, a.wrapS = a.wrapT = r, a.needsUpdate = !0, a;
	}, [r, i, a] = await Promise.all([
		n("bg_sekai.png", y.ClampToEdgeWrapping, !1),
		n("tex_sekai_v2_02.png", y.RepeatWrapping, !0),
		n("tex_transition_01.png", y.ClampToEdgeWrapping, !1)
	]);
	return {
		background: r,
		triangles: i,
		flare: a
	};
}
var $n = class {
	textures;
	simulation;
	scene = new y.Scene();
	camera = new y.OrthographicCamera(0, 1, 1, 0, -1, 1);
	matrixVP = new y.Matrix4();
	screenParams = new y.Vector4();
	backgroundMesh;
	backgroundPositions;
	triMesh;
	triPositions;
	triColors;
	triUVs;
	flareMesh;
	flarePositions;
	flareColors;
	opaqueMesh;
	capacity;
	underlayColor = new y.Color(1, 1, 1);
	constructor(e, t = 1) {
		this.textures = e, this.simulation = new Kn(t), this.simulation.prewarm();
		let n = () => ({ value: new y.Matrix4().elements }), r = () => ({ value: new y.Vector4(-32767, -32767, 32767, 32767) }), i = new y.BufferGeometry();
		this.backgroundPositions = new y.BufferAttribute(/* @__PURE__ */ new Float32Array(12), 3), i.setAttribute("in_POSITION0", this.backgroundPositions), i.setAttribute("in_COLOR0", new y.BufferAttribute((/* @__PURE__ */ new Uint8Array(16)).fill(255), 4, !0)), i.setAttribute("in_TEXCOORD0", new y.BufferAttribute(new Float32Array([
			0,
			0,
			0,
			1,
			1,
			1,
			1,
			0
		]), 2)), i.setIndex(Yn(1)), this.backgroundMesh = new y.Mesh(i, qn(In, Jn(In), {
			hlslcc_mtx4x4unity_ObjectToWorld: n(),
			hlslcc_mtx4x4unity_MatrixVP: { value: this.matrixVP.elements },
			hlslcc_mtx4x4glstate_matrix_projection: { value: this.matrixVP.elements },
			_ScreenParams: { value: this.screenParams },
			_UIMaskSoftnessX: { value: 0 },
			_UIMaskSoftnessY: { value: 0 },
			_Color: { value: new y.Vector4(1, 1, 1, 1) },
			_TextureSampleAdd: { value: new y.Vector4(0, 0, 0, 0) },
			_MainTex_ST: { value: new y.Vector4(1, 1, 0, 0) },
			_ClipRect: r(),
			_MainTex: { value: e.background }
		})), this.capacity = 64;
		let a = new y.BufferGeometry();
		this.triPositions = new y.BufferAttribute(new Float32Array(this.capacity * 12), 3), this.triColors = new y.BufferAttribute(new Uint8Array(this.capacity * 16), 4, !0), this.triUVs = new y.BufferAttribute(new Float32Array(this.capacity * 8), 2), this.triMesh = new y.Mesh(a, qn(Ln, Jn(Ln), {
			hlslcc_mtx4x4unity_ObjectToWorld: n(),
			hlslcc_mtx4x4unity_MatrixVP: { value: this.matrixVP.elements },
			_Color: { value: new y.Vector4(1, 1, 1, 1) },
			_MainTex_ST: { value: new y.Vector4(1, 1, 0, 0) },
			_ClipRect: r(),
			_MainTex: { value: e.triangles }
		})), this.setTriAttributes();
		let o = new y.BufferGeometry();
		this.flarePositions = new y.BufferAttribute(/* @__PURE__ */ new Float32Array(12), 3), this.flareColors = new y.BufferAttribute(/* @__PURE__ */ new Uint8Array(16), 4, !0);
		let [s, c] = Xn(Wn(Bn.flare.startFrame, Bn.flare.tiles), Bn.flare.tiles), [l, u] = Bn.flare.tiles;
		o.setAttribute("in_POSITION0", this.flarePositions), o.setAttribute("in_COLOR0", this.flareColors), o.setAttribute("in_TEXCOORD0", new y.BufferAttribute(new Float32Array(Zn.flatMap(([e, t]) => [
			s + (e + .5) / l,
			c + (t + .5) / u,
			0
		])), 3)), o.setIndex(Yn(1));
		let d = Rn;
		this.flareMesh = new y.Mesh(o, qn(d, Jn(d, 1), {
			hlslcc_mtx4x4unity_ObjectToWorld: n(),
			hlslcc_mtx4x4unity_MatrixVP: { value: this.matrixVP.elements },
			_MainTex_ST: { value: new y.Vector4(1, 1, 0, 0) },
			_GlobalMipBias: { value: new y.Vector2(0, 0) },
			_MainTex: { value: e.flare }
		})), this.opaqueMesh = new y.Mesh(new y.PlaneGeometry(2, 2), new y.RawShaderMaterial({
			glslVersion: y.GLSL3,
			vertexShader: "in vec3 position; void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",
			fragmentShader: "precision mediump float; out vec4 color; void main() { color = vec4(0.0, 0.0, 0.0, 1.0); }",
			blending: y.CustomBlending,
			blendSrc: y.ZeroFactor,
			blendDst: y.OneFactor,
			blendSrcAlpha: y.OneFactor,
			blendDstAlpha: y.ZeroFactor,
			depthTest: !1,
			depthWrite: !1
		})), [
			this.backgroundMesh,
			this.triMesh,
			this.flareMesh,
			this.opaqueMesh
		].forEach((e, t) => {
			e.renderOrder = t, e.frustumCulled = !1, this.scene.add(e);
		});
	}
	setTriAttributes() {
		let e = this.triMesh.geometry;
		e.setAttribute("in_POSITION0", this.triPositions), e.setAttribute("in_COLOR0", this.triColors), e.setAttribute("in_TEXCOORD0", this.triUVs), e.setIndex(Yn(this.capacity));
	}
	ensureCapacity(e) {
		if (!(e <= this.capacity)) {
			for (; this.capacity < e;) this.capacity *= 2;
			this.triMesh.geometry.dispose(), this.triPositions = new y.BufferAttribute(new Float32Array(this.capacity * 12), 3), this.triColors = new y.BufferAttribute(new Uint8Array(this.capacity * 16), 4, !0), this.triUVs = new y.BufferAttribute(new Float32Array(this.capacity * 8), 2), this.setTriAttributes();
		}
	}
	step(e) {
		e > 0 && this.simulation.step(e);
	}
	layout(e, t) {
		let n = Bn, r = e.screenHeight / n.panelSize[1], i = e.screenHeight * .5, a = n.backgroundSize[0] * .5 * r, o = n.backgroundSize[1] * .5 * r;
		this.backgroundPositions.array.set(Zn.flatMap(([e, n]) => [
			t + e * 2 * a,
			i + n * 2 * o,
			0
		])), this.backgroundPositions.needsUpdate = !0;
		let s = n.particleScale * r, c = this.simulation.tri;
		this.ensureCapacity(c.length);
		let l = this.triPositions.array, u = this.triColors.array, d = this.triUVs.array, [f, p] = n.tri.tiles;
		for (let e = 0; e < c.length; e++) {
			let r = c[e], a = r.age / r.lifetime, o = r.startSize * Hn(n.tri.sizeCurve, a) * s, m = t + r.x * s, h = i + r.y * s, [g, _, v] = r.rotation, y = Math.cos(-v), b = Math.sin(-v), x = Math.cos(g), S = Math.sin(g), ee = Math.cos(_), C = Math.sin(_), w = Math.round(Un(n.tri.alphaKeys, a) * 255), [te, T] = Xn(r.frame, n.tri.tiles);
			for (let t = 0; t < 4; t++) {
				let [n, r] = Zn[t], i = n * y - r * b, a = n * b + r * y, s = a * x, c = a * S, g = i * ee + c * C, _ = e * 4 + t;
				l[_ * 3] = m + g * o, l[_ * 3 + 1] = h + s * o, l[_ * 3 + 2] = 0, u.set([
					255,
					255,
					255,
					w
				], _ * 4), d[_ * 2] = te + (n + .5) / f, d[_ * 2 + 1] = T + (r + .5) / p;
			}
		}
		this.triMesh.geometry.setDrawRange(0, c.length * 6), this.triPositions.needsUpdate = !0, this.triColors.needsUpdate = !0, this.triUVs.needsUpdate = !0;
		let m = n.flare, h = this.simulation.flareAge / m.lifetime, g = m.size * m.sizeMultiplier * Hn(m.sizeCurve, h) * s, _ = t + m.offset[0] * s, v = i + m.offset[1] * s;
		this.flarePositions.array.set(Zn.flatMap(([e, t]) => [
			_ + e * g,
			v + t * g,
			0
		])), this.flarePositions.needsUpdate = !0;
		let y = [...m.color.map((e) => Math.round(e * 255)), Math.round(Un(m.alphaKeys, h) * 255)];
		for (let e = 0; e < 4; e++) this.flareColors.array.set(y, e * 4);
		this.flareColors.needsUpdate = !0;
	}
	render(e, t, n = t.screenWidth * .5, r = null) {
		this.matrixVP.makeOrthographic(0, t.screenWidth, t.screenHeight, 0, -1, 1), this.screenParams.set(t.screenWidth, t.screenHeight, 1 + 1 / t.screenWidth, 1 + 1 / t.screenHeight), this.layout(t, n);
		let i = e.getClearColor(new y.Color()), a = e.getClearAlpha();
		e.setRenderTarget(r), e.setClearColor(this.underlayColor, 1), e.clear(!0, !0, !0);
		let o = e.autoClear;
		e.autoClear = !1, e.render(this.scene, this.camera), e.autoClear = o, e.setClearColor(i, a);
	}
	dispose() {
		for (let e of [
			this.backgroundMesh,
			this.triMesh,
			this.flareMesh,
			this.opaqueMesh
		]) e.geometry.dispose(), e.material.dispose();
		for (let e of Object.values(this.textures)) e.dispose();
	}
}, er = Math.fround, tr = 1.6;
function nr(e) {
	return er((Number.isFinite(e) && e > 0 ? e : tr) * 100);
}
function rr(e) {
	let t = nr(e);
	return er(er(er(er(t - 160) * .5) + 160) / t);
}
function ir(e) {
	return er(er(nr(e) * rr(e)) * .01);
}
//#endregion
//#region src/engine/official/sekaiLightComponents.ts
var ar = Math.PI / 180;
function or(e, t, n) {
	let r = e * ar * .5, i = t * ar * .5, a = n * ar * .5, o = [
		Math.sin(r),
		0,
		0,
		Math.cos(r)
	], s = [
		0,
		Math.sin(i),
		0,
		Math.cos(i)
	], c = [
		0,
		0,
		Math.sin(a),
		Math.cos(a)
	];
	return sr(sr(s, o), c);
}
function sr(e, t) {
	return [
		e[3] * t[0] + e[0] * t[3] + e[1] * t[2] - e[2] * t[1],
		e[3] * t[1] + e[1] * t[3] + e[2] * t[0] - e[0] * t[2],
		e[3] * t[2] + e[2] * t[3] + e[0] * t[1] - e[1] * t[0],
		e[3] * t[3] - e[0] * t[0] - e[1] * t[1] - e[2] * t[2]
	];
}
function cr(e, t) {
	let [n, r, i, a] = e, o = n * 2, s = r * 2, c = i * 2, l = n * o, u = r * s, d = i * c, f = n * s, p = n * c, m = r * c, h = a * o, g = a * s, _ = a * c;
	return [
		(1 - (u + d)) * t[0] + (f - _) * t[1] + (p + g) * t[2],
		(f + _) * t[0] + (1 - (l + d)) * t[1] + (m - h) * t[2],
		(p - g) * t[0] + (m + h) * t[1] + (1 - (l + u)) * t[2]
	];
}
function lr(e) {
	return cr(e, [
		0,
		0,
		1
	]);
}
function ur(e) {
	return e <= .04045 ? e / 12.92 : e < 1 ? ((e + .055) / 1.055) ** 2.4 : e ** 2.2;
}
var dr = class {
	localRotation = [
		0,
		0,
		0,
		1
	];
	parentRotation = [
		0,
		0,
		0,
		1
	];
	position = [
		0,
		0,
		0
	];
	get rotation() {
		return sr(this.parentRotation, this.localRotation);
	}
	get forward() {
		return lr(this.rotation);
	}
	setLocalEulerAngles(e, t, n) {
		this.localRotation = or(e, t, n);
	}
}, fr = class {
	fogColor = {
		r: 1,
		g: 1,
		b: 1,
		a: 1
	};
	fogStart = 1;
	fogEnd = 300;
	intensity = 1;
	quality = 500;
	update(e) {
		e.maximumLOD = this.quality, this.fogStart >= this.fogEnd ? e.setVector("_SekaiFogFactor", 1, 0, 0, 0) : e.setVector("_SekaiFogFactor", Math.fround(this.fogEnd / (this.fogEnd - this.fogStart)), Math.fround(1 / (this.fogEnd - this.fogStart)), 0, 0), e.setColor("_SekaiFogColor", this.fogColor), e.setFloat("_SekaiAllLightIntensity", this.intensity);
	}
}, pr = class {
	useFaceShadowLimiter = !0;
	faceShadowLimitRange = 0;
	shadowTexWeight = 0;
	useShadowFade = !1;
	fade = 1;
	shadowWidth = 0;
	useHsvControl = !1;
	hue = 0;
	saturation = .5;
	value = .5;
	contrast = .5;
	initialize() {
		this.useShadowFade = !1, this.shadowWidth = 0, this.useHsvControl = !1, this.useFaceShadowLimiter = !0, this.faceShadowLimitRange = 0, this.shadowTexWeight = 1, this.hue = 0, this.saturation = .5, this.value = .5, this.contrast = .5;
	}
}, mr = class {
	transform = new dr();
	characterDirectionalLightData = new pr();
	shadowColor = {
		r: 1,
		g: 1,
		b: 1,
		a: 1
	};
	shadowThreshold = .40625;
	start() {
		this.characterDirectionalLightData.initialize();
	}
	update(e) {
		let t = this.transform.forward;
		e.setVector("_WorldSpaceLightPos0", t[0], t[1], t[2], 0), e.setVector("_SekaiDirectionalLight", t[0], t[1], t[2], 0), e.setColor("_SekaiShadowColor", this.shadowColor), e.setFloat("_SekaiShadowThreshold", this.shadowThreshold);
	}
}, P = 12, hr = (e) => [
	e.r,
	e.g,
	e.b,
	e.a
], gr = class e {
	static intensityArray = Array(P).fill(0);
	static colorArray = Array.from({ length: P }, () => [
		0,
		0,
		0,
		0
	]);
	static specularColorArray = Array.from({ length: P }, () => [
		0,
		0,
		0,
		0
	]);
	static outlineColorArray = Array.from({ length: P }, () => [
		0,
		0,
		0,
		0
	]);
	static outlineBlendingArray = Array(P).fill(0);
	ambientColor = {
		r: .5,
		g: .5,
		b: .5,
		a: 1
	};
	intensity = 1;
	specularColor = {
		r: 1,
		g: 1,
		b: 1,
		a: 1
	};
	outlineColor = {
		r: 0,
		g: 0,
		b: 0,
		a: 1
	};
	outlineBlending = .5;
	formationId = 0;
	update(t) {
		let n = e;
		n.intensityArray[this.formationId] = this.intensity, n.colorArray[this.formationId] = hr(this.ambientColor), n.specularColorArray[this.formationId] = hr(this.specularColor), n.outlineColorArray[this.formationId] = hr(this.outlineColor), n.outlineBlendingArray[this.formationId] = this.outlineBlending, t.setFloatArray("_SekaiCharacterAmbientLightIntensityArray", n.intensityArray), t.setVectorArray("_SekaiCharacterAmbientLightColorArray", n.colorArray), t.setVectorArray("_SekaiCharacterSpecularColorArray", n.specularColorArray), t.setVectorArray("_SekaiCharacterOutlineColorArray", n.outlineColorArray), t.setFloatArray("_SekaiCharacterOutlineBlendingArray", n.outlineBlendingArray);
	}
}, _r = class e {
	static lightArray = Array.from({ length: P }, () => [
		0,
		0,
		0,
		0
	]);
	static colorArray = Array.from({ length: P }, () => [
		0,
		0,
		0,
		0
	]);
	static shadowColorArray = Array.from({ length: P }, () => [
		0,
		0,
		0,
		0
	]);
	static factorArray = Array.from({ length: P }, () => [
		0,
		0,
		0,
		0
	]);
	static shadowSharpnessArray = Array(P).fill(0);
	transform = new dr();
	rimColor = {
		r: 1,
		g: 1,
		b: 1,
		a: 1
	};
	range = 1;
	edgeSmoothness = .0010000000474974513;
	emission = 0;
	directionMode = 0;
	rimDirectionVector = [
		-1,
		0,
		0
	];
	lightInfluence = 1;
	isUseShadowColor = !1;
	shadowRimColor = {
		r: 0,
		g: 0,
		b: 0,
		a: 1
	};
	shadowSharpness = .5;
	formationId = 0;
	mainCameraLocalToWorld = null;
	setup(e, t, n) {
		this.mainCameraLocalToWorld = t, this.formationId = e, this.range = n;
	}
	getRimLightDirection() {
		let e;
		if (this.directionMode === 1) {
			let t = this.mainCameraLocalToWorld;
			if (!t) throw Error("SekaiCharacterRimLight ScreenVector needs the main camera");
			let [n, r, i] = [
				-this.rimDirectionVector[0],
				-this.rimDirectionVector[1],
				-this.rimDirectionVector[2]
			], a = t[0] * n + t[4] * r + t[8] * i, o = t[1] * n + t[5] * r + t[9] * i, s = t[2] * n + t[6] * r + t[10] * i, c = Math.sqrt(s * s + (a * a + o * o));
			e = c <= 1e-5 ? [
				0,
				0,
				0
			] : [
				a / c,
				o / c,
				s / c
			];
		} else e = this.transform.forward;
		let t = Math.sqrt(e[2] * e[2] + (e[0] * e[0] + e[1] * e[1]));
		return t <= 1e-5 ? [
			0,
			0,
			0
		] : [
			e[0] / t,
			e[1] / t,
			e[2] / t
		];
	}
	update(t) {
		let n = e, r = this.getRimLightDirection();
		n.lightArray[this.formationId] = [
			r[0],
			r[1],
			r[2],
			0
		], n.colorArray[this.formationId] = hr(this.rimColor), n.shadowColorArray[this.formationId] = hr(this.isUseShadowColor ? this.shadowRimColor : this.rimColor), n.factorArray[this.formationId] = [
			this.range,
			this.emission,
			this.edgeSmoothness,
			ur(this.lightInfluence)
		], n.shadowSharpnessArray[this.formationId] = this.shadowSharpness, t.setVectorArray("_SekaiRimLightArray", n.lightArray), t.setVectorArray("_SekaiRimLightColorArray", n.colorArray), t.setVectorArray("_SekaiShadowRimLightColorArray", n.shadowColorArray), t.setVectorArray("_SekaiRimLightFactor", n.factorArray), t.setFloatArray("_SekaiRimLightShadowSharpnessArray", n.shadowSharpnessArray);
	}
}, vr = class {
	transform = new dr();
	outerColor = {
		r: 1,
		g: 1,
		b: 1,
		a: 1
	};
	radiusNear = 999;
	radiusFar = 1e3;
	update(e) {
		let t = this.transform.position;
		e.setVector("_SekaiGlobalSpotLightPos", t[0], t[1], t[2], 0), e.setColor("_SekaiGlobalSpotLightColor", this.outerColor), e.setFloat("_SekaiGlobalSpotLightRadiusNear", this.radiusNear * this.radiusNear), e.setFloat("_SekaiGlobalSpotLightRadiusFar", this.radiusFar * this.radiusFar);
	}
}, yr = class {
	maximumLOD = 2147483647;
	values = /* @__PURE__ */ new Map();
	version = 0;
	get revision() {
		return this.version;
	}
	setFloat(e, t) {
		this.set(e, t);
	}
	setInt(e, t) {
		this.set(e, Math.trunc(t));
	}
	setVector(e, t, n, r, i) {
		this.set(e, [
			t,
			n,
			r,
			i
		]);
	}
	setColor(e, t) {
		this.set(e, [
			t.r,
			t.g,
			t.b,
			t.a
		]);
	}
	setFloatArray(e, t) {
		this.set(e, Float32Array.from(t));
	}
	setVectorArray(e, t) {
		let n = new Float32Array(t.length * 4);
		t.forEach((e, t) => n.set(e, t * 4)), this.set(e, n);
	}
	setTexture(e, t) {
		this.set(e, t);
	}
	get(e) {
		return this.values.get(e);
	}
	set(e, t) {
		this.values.set(e, t), this.version++;
	}
}, br = {
	DIRECTIONAL_LIGHT_ROTATION: [
		-15,
		50,
		0
	],
	CHARACTER_RIM_LIGHT_ROTATION: [
		20,
		-60,
		0
	],
	CHARACTER_RIM_LIGHT_COLOR: {
		r: .5,
		g: .5,
		b: .5,
		a: 1
	},
	CHARACTER_RIM_LIGHT_RANGE: 7,
	CHARACTER_AMBIENT_LIGHT_COLOR: {
		r: .5,
		g: .5,
		b: .5,
		a: 1
	}
}, xr = class {
	globals;
	settings = new fr();
	directional = new mr();
	ambient = new gr();
	rim = new _r();
	spot = new vr();
	constructor(e = new yr()) {
		this.globals = e;
		let t = br;
		this.settings.quality = 300, this.ambient.formationId = 0, this.rim.setup(0, null, t.CHARACTER_RIM_LIGHT_RANGE), this.rim.rimColor = { ...t.CHARACTER_RIM_LIGHT_COLOR }, this.rim.transform.setLocalEulerAngles(...t.CHARACTER_RIM_LIGHT_ROTATION), this.directional.transform.setLocalEulerAngles(...t.DIRECTIONAL_LIGHT_ROTATION), this.ambient.ambientColor = { ...t.CHARACTER_AMBIENT_LIGHT_COLOR }, this.directional.start();
	}
	setCameraRoot(e, t) {
		for (let n of [
			this.directional.transform,
			this.rim.transform,
			this.spot.transform
		]) n.parentRotation = e, n.position = t;
	}
	setRenderCamera(e) {
		this.rim.mainCameraLocalToWorld = e;
	}
	update() {
		this.settings.update(this.globals), this.directional.update(this.globals), this.ambient.update(this.globals), this.rim.update(this.globals), this.spot.update(this.globals);
	}
}, F = Math.fround;
function Sr(e, t) {
	return Number.isNaN(e) ? t : Number.isNaN(t) ? e : Math.min(e, t);
}
function Cr(e) {
	return e < 0 ? 0 : Sr(e, 1);
}
var wr = [1920, 1080], Tr = {
	viewerAnchoredX: -583,
	shadowAnchoredX: 35,
	shadowColor: [
		.26666668,
		.26666668,
		.4,
		.10196079
	],
	modelColor: [
		1,
		1,
		1,
		1
	]
}, Er = 10, Dr = F(.001);
function Or(e, t) {
	let [n, r] = wr, i = F(t / e) >= F(r / n) ? 0 : 1, a = F(Math.log2(F(e / n))), o = F(2 ** F(a + F(F(F(Math.log2(F(t / r))) - a) * i))), s = F(e / o), c = F(t / o), l = c, u = F(F(s * .5) + Tr.viewerAnchoredX), d = (e) => ({
		x: F(F(F(u + e) - F(l * .5)) * o),
		y: 0,
		width: F(l * o),
		height: F(l * o)
	});
	return {
		screenWidth: e,
		screenHeight: t,
		scaleFactor: o,
		contentWidth: s,
		contentHeight: c,
		modelTexture: d(0),
		shadowTexture: d(Tr.shadowAnchoredX)
	};
}
var kr = {
	viewerSize: [759.55, 647.28],
	shadowAnchoredX: 35
};
function Ar(e, t) {
	let n = t, r = n / kr.viewerSize[1], i = Math.round((e - n) * .5), a = (e) => ({
		x: i + e * r,
		y: 0,
		width: n,
		height: n
	});
	return {
		screenWidth: e,
		screenHeight: t,
		scaleFactor: r,
		contentWidth: e / r,
		contentHeight: kr.viewerSize[1],
		modelTexture: a(0),
		shadowTexture: a(kr.shadowAnchoredX)
	};
}
var jr = class {
	studio;
	pointerList = [];
	gestureData = {
		pointerCount: 0,
		prevPointerCount: 0,
		distance: 0,
		prevDistance: 0,
		deltaScale: 0,
		screenPosition: [[0, 0], [0, 0]],
		dragDelta: [[0, 0], [0, 0]]
	};
	currentPinchCenter = 0;
	prevTouchCount = 0;
	isZoomIncontinuous = !1;
	colliderState = "model";
	touches = /* @__PURE__ */ new Map();
	pointerData = /* @__PURE__ */ new Map();
	constructor(e) {
		this.studio = e;
	}
	touchBegan(e, t, n) {
		this.touches.set(e, {
			id: e,
			x: t,
			y: n,
			began: !0,
			ended: !1
		});
	}
	touchMoved(e, t, n) {
		let r = this.touches.get(e);
		!r || r.ended || (r.x = t, r.y = n);
	}
	touchEnded(e, t, n) {
		let r = this.touches.get(e);
		!r || r.ended || (r.x = t, r.y = n, r.ended = !0);
	}
	update(e, t) {
		for (let t of [...this.touches.values()]) {
			let n = !this.pointerData.has(t.id), r = this.pointerData.get(t.id) ?? {
				pointerId: t.id,
				position: [t.x, t.y],
				delta: [0, 0],
				pressPosition: [0, 0],
				pressedCollider: !1
			};
			this.pointerData.set(t.id, r);
			let i = n || t.began;
			r.delta = i ? [0, 0] : [F(t.x - r.position[0]), F(t.y - r.position[1])], r.position = [t.x, t.y], i && (r.pressPosition = [t.x, t.y], this.colliderContains(e, t.x, t.y) && (r.pressedCollider = !0, this.onPointerDown(), this.listenerPointerDown(r))), t.began = !1, t.ended && (r.pressedCollider && (this.onPointerUp(), this.listenerPointerUp(r)), this.pointerData.delete(t.id), this.touches.delete(t.id));
		}
		this.listenerUpdate(t, e.screenHeight);
	}
	get snapshot() {
		return {
			touchCount: this.pointerList.length,
			collider: this.colliderState,
			isZoomIncontinuous: this.isZoomIncontinuous,
			currentPinchCenter: this.currentPinchCenter
		};
	}
	colliderContains(e, t, n) {
		if (this.colliderState === "extended") return !0;
		let r = e.modelTexture, i = this.colliderState === "released" ? F(r.width * .5) : 0;
		return t >= r.x - i && t <= r.x + r.width + i && n >= r.y && n <= r.y + r.height;
	}
	onPointerDown() {
		this.colliderState = "extended";
	}
	onPointerUp() {
		this.colliderState = "released";
	}
	listenerPointerDown(e) {
		this.pointerList.length <= 1 && !this.pointerList.includes(e) && this.pointerList.push(e);
	}
	listenerPointerUp(e) {
		let t = this.pointerList.indexOf(e);
		t >= 0 && this.pointerList.splice(t, 1), this.pointerList.length <= 1 && this.onPinchScaleEnd();
	}
	listenerUpdate(e, t) {
		let n = this.gestureData;
		n.prevDistance = n.distance, n.prevPointerCount = n.pointerCount, n.pointerCount = Math.min(this.pointerList.length, 2);
		for (let e = 0; e < n.pointerCount; e++) n.screenPosition[e] = [...this.pointerList[e].position], n.dragDelta[e] = [...this.pointerList[e].delta];
		let r = this.pointerList.length;
		if (r >= 2) {
			let e = this.pointerList[0].position, r = this.pointerList[1].position, i = F(e[0] - r[0]), a = F(e[1] - r[1]), o = F(Math.sqrt(F(F(i * i) + F(a * a))));
			n.distance = o, n.prevPointerCount < 2 && (n.prevDistance = o), n.deltaScale = F(o - n.prevDistance), this.onPinchScale(t);
		} else if (r === 1) {
			n.deltaScale = 0, n.distance = 0;
			let t = this.pointerList[0], r = F(Math.sqrt(F(F(t.pressPosition[0] * t.pressPosition[0]) + F(t.pressPosition[1] * t.pressPosition[1])))), i = F(Math.sqrt(F(F(t.position[0] * t.position[0]) + F(t.position[1] * t.position[1]))));
			Math.abs(F(r - i)) > Er && this.onDrag(e);
		}
	}
	onDrag(e) {
		let t = this.gestureData;
		if (t.pointerCount > 1) return;
		let [n, r] = t.dragDelta[0];
		this.studio.rotate(F(n * F(-.33)), 0, e), this.studio.moveVertical(F(r * F(-.001)));
	}
	onPinchScale(e) {
		let t = this.gestureData.deltaScale;
		Math.abs(t) > .1 && this.updatePinch(-t, e);
	}
	updatePinch(e, t) {
		let n = this.pointerList.length;
		e < 0 && n !== this.prevTouchCount && this.studio.zoomDurationRatio > 0 ? (this.isZoomIncontinuous = !0, this.updatePinchCenter()) : e > 0 && this.studio.zoomDurationRatio < 1 && (this.isZoomIncontinuous = !1);
		let r = this.isZoomIncontinuous ? this.calculatePinchCenterY(t) : this.studio.zoomMoveValue;
		this.studio.zoom(F(Dr * e), r, !1), this.prevTouchCount = this.pointerList.length;
	}
	updatePinchCenter() {
		let [e, t] = this.gestureData.screenPosition;
		this.currentPinchCenter = F(e[1] + F(F(t[1] - e[1]) * .5));
	}
	calculatePinchCenterY(e) {
		let t = this.studio.zoomMoveValue, n = Cr(F(this.currentPinchCenter / e)), r = Cr(F(this.studio.zoomDurationRatio * .5));
		return Cr(F(t + F(F(n - t) * r)));
	}
	onPinchScaleEnd() {
		this.prevTouchCount = 0;
	}
}, Mr = 2, Nr = 2048;
function Pr(e, t = Nr) {
	let n = Math.max(1, Math.round(e)), r = Math.max(1, Math.min(t, n * Mr));
	return {
		side: n,
		targetSide: r,
		footprint: r / n
	};
}
var Fr = "\nin vec2 position;\nout vec2 vUv;\nvoid main() {\n  vUv = position * 0.5 + 0.5;\n  gl_Position = vec4(position, 0.0, 1.0);\n}", Ir = "\nprecision highp float;\nuniform sampler2D source;\nuniform vec2 texel;\nuniform float footprint;\nin vec2 vUv;\nout vec4 outColor;\nvoid main() {\n  vec2 d = texel * footprint * 0.25;\n  outColor = 0.25 * (\n    texture(source, vUv + vec2(-d.x, -d.y)) +\n    texture(source, vUv + vec2(d.x, -d.y)) +\n    texture(source, vUv + vec2(-d.x, d.y)) +\n    texture(source, vUv + vec2(d.x, d.y)));\n}";
function Lr(e) {
	return new y.WebGLRenderTarget(1, 1, {
		format: y.RGBAFormat,
		type: y.UnsignedByteType,
		depthBuffer: e,
		stencilBuffer: e,
		generateMipmaps: !1,
		minFilter: y.LinearFilter,
		magFilter: y.LinearFilter,
		wrapS: y.ClampToEdgeWrapping,
		wrapT: y.ClampToEdgeWrapping,
		colorSpace: y.NoColorSpace
	});
}
var Rr = class {
	studioTarget = Lr(!0);
	output = Lr(!1);
	plan = null;
	material;
	scene = new y.Scene();
	camera = new y.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	constructor() {
		this.material = new y.RawShaderMaterial({
			glslVersion: y.GLSL3,
			vertexShader: Fr,
			fragmentShader: Ir,
			uniforms: {
				source: { value: this.studioTarget.texture },
				texel: { value: new y.Vector2(1, 1) },
				footprint: { value: 1 }
			},
			depthTest: !1,
			depthWrite: !1,
			blending: y.NoBlending
		});
		let e = new y.BufferGeometry();
		e.setAttribute("position", new y.Float32BufferAttribute([
			-1,
			-1,
			3,
			-1,
			-1,
			3
		], 2));
		let t = new y.Mesh(e, this.material);
		t.frustumCulled = !1, this.scene.add(t);
	}
	resize(e, t) {
		let n = Pr(e, t);
		return this.plan?.targetSide !== n.targetSide && this.studioTarget.setSize(n.targetSide, n.targetSide), this.plan?.side !== n.side && this.output.setSize(n.side, n.side), this.plan = n, this.material.uniforms.texel.value.set(1 / n.targetSide, 1 / n.targetSide), this.material.uniforms.footprint.value = n.footprint, n;
	}
	downsample(e) {
		let t = e.autoClear;
		e.setRenderTarget(this.output), e.autoClear = !0, e.render(this.scene, this.camera), e.autoClear = t;
	}
	dispose() {
		this.studioTarget.dispose(), this.output.dispose(), this.material.dispose();
		for (let e of this.scene.children) e.geometry.dispose();
	}
}, zr = ["all", "head_optional"];
function Br(e) {
	if (!zr.includes(e)) throw Error(`part display must be one of ${zr.map((e) => `"${e}"`).join(", ")}.`);
}
function Vr(e) {
	return !!e.userData?.pjskNativeUnityMesh && e.userData?.pjskPartKind === "Accessory";
}
function Hr(e) {
	let t = [];
	return e.traverse((e) => {
		e.isMesh && Vr(e) && t.push(e);
	}), t;
}
function Ur(e) {
	let t = null;
	for (let n = e[0] ?? null; n; n = n.parent) if (n.userData?.pjskTransformPath === "optional") {
		t = n;
		break;
	}
	if (!t) return null;
	let n = (e) => {
		for (let n = e; n; n = n.parent) if (n === t) return !0;
		return !1;
	};
	for (let t of e) {
		if (!n(t)) return null;
		for (let e of t.skeleton?.bones ?? []) if (!n(e)) return null;
	}
	return t;
}
function Wr(e) {
	let t = new y.Box3(), n = new y.Vector3();
	for (let r of e) {
		r.updateWorldMatrix(!0, !1);
		let e = r.geometry.getAttribute("position");
		if (e) for (let i = 0; i < e.count; i++) t.expandByPoint(r.getVertexPosition(i, n).applyMatrix4(r.matrixWorld));
	}
	if (t.isEmpty()) return null;
	let r = t.getBoundingSphere(new y.Sphere());
	return r.radius = Math.max(r.radius, .005), r;
}
var Gr = 1.2;
function Kr(e, t, n, r, i, a = new y.Vector3()) {
	let o = y.MathUtils.degToRad(r) / 2, s = Math.atan(Math.tan(o) * (i > 0 ? i : 1)), c = t * Gr / Math.sin(Math.min(o, s));
	return a.set(0, 0, c).applyAxisAngle(y.Object3D.DEFAULT_UP, y.MathUtils.degToRad(Number.isFinite(n) ? n : 0)).add(e), {
		target: e,
		position: a,
		distance: c
	};
}
var qr = class {
	group = new y.Group();
	detached = null;
	radius = 0;
	constructor() {
		this.group.name = "HeadOptionalStage";
	}
	get root() {
		return this.detached?.root ?? null;
	}
	detach(e) {
		this.reattach(), e.updateMatrixWorld(!0);
		let t = Hr(e), n = Ur(t);
		if (!n?.parent) return !1;
		this.detached = {
			root: n,
			parent: n.parent,
			position: n.position.clone(),
			quaternion: n.quaternion.clone(),
			scale: n.scale.clone()
		}, this.group.position.set(0, 0, 0), this.group.quaternion.identity(), this.group.scale.set(1, 1, 1), this.group.updateMatrixWorld(!0), this.group.attach(n), this.group.updateMatrixWorld(!0);
		let r = Wr(t);
		return r && (this.group.position.copy(r.center).negate(), this.group.updateMatrixWorld(!0)), this.radius = r?.radius ?? .1, !0;
	}
	reattach() {
		let e = this.detached;
		e && (this.detached = null, e.parent.add(e.root), e.root.position.copy(e.position), e.root.quaternion.copy(e.quaternion), e.root.scale.copy(e.scale), e.root.updateMatrixWorld(!0), this.group.position.set(0, 0, 0), this.radius = 0);
	}
};
//#endregion
//#region src/costume_shop/costumeShopViewerComposite.ts
function Jr(e) {
	return e.map((e) => Math.round(Math.min(Math.max(e, 0), 1) * 255));
}
function Yr() {
	return new y.WebGLRenderTarget(M.textureWidth, M.textureHeight, {
		format: y.RGBAFormat,
		type: y.UnsignedByteType,
		depthBuffer: !0,
		stencilBuffer: !0,
		generateMipmaps: !1,
		minFilter: y.LinearFilter,
		magFilter: y.LinearFilter,
		wrapS: y.RepeatWrapping,
		wrapT: y.RepeatWrapping,
		colorSpace: y.NoColorSpace
	});
}
var Xr = class {
	scene = new y.Scene();
	camera = new y.OrthographicCamera(0, 1, 1, 0, -1, 1);
	shadow;
	model;
	matrixVP = new y.Matrix4();
	constructor(e, t = !0) {
		let n = In, r = Sn(xn(n, 300), "Default"), i = n.programs[Cn(r, []).program];
		if (!i) throw Error("UI/Default: program missing from the table");
		let a = (t, a) => {
			let o = new y.RawShaderMaterial({
				name: "UI/Default",
				glslVersion: y.GLSL3,
				vertexShader: hn(i.vertex),
				fragmentShader: hn(i.fragment),
				uniforms: {
					_ScreenParams: { value: new y.Vector4() },
					hlslcc_mtx4x4unity_ObjectToWorld: { value: new y.Matrix4().elements },
					hlslcc_mtx4x4glstate_matrix_projection: { value: this.matrixVP.elements },
					hlslcc_mtx4x4unity_MatrixVP: { value: this.matrixVP.elements },
					_Color: { value: new y.Vector4(1, 1, 1, 1) },
					_ClipRect: { value: new y.Vector4(-32767, -32767, 32767, 32767) },
					_MainTex_ST: { value: new y.Vector4(1, 1, 0, 0) },
					_UIMaskSoftnessX: { value: 0 },
					_UIMaskSoftnessY: { value: 0 },
					_TextureSampleAdd: { value: new y.Vector4(0, 0, 0, 0) },
					_MainTex: { value: e }
				}
			});
			Pn(o, n, r, {
				float: (e) => e === "unity_GUIZTestMode" ? 8 : null,
				color: () => null
			});
			let s = new y.BufferGeometry(), c = new y.BufferAttribute(/* @__PURE__ */ new Float32Array(12), 3);
			s.setAttribute("in_POSITION0", c);
			let l = Jr(t);
			s.setAttribute("in_COLOR0", new y.BufferAttribute(new Uint8Array([
				...l,
				...l,
				...l,
				...l
			]), 4, !0)), s.setAttribute("in_TEXCOORD0", new y.BufferAttribute(new Float32Array([
				0,
				0,
				0,
				1,
				1,
				1,
				1,
				0
			]), 2)), s.setIndex([
				0,
				1,
				2,
				2,
				3,
				0
			]);
			let u = new y.Mesh(s, o);
			return u.frustumCulled = !1, u.renderOrder = a, this.scene.add(u), {
				mesh: u,
				positions: c,
				material: o
			};
		};
		this.shadow = a(Tr.shadowColor, 0), this.shadow.mesh.visible = t, this.model = a(Tr.modelColor, 1);
	}
	render(e, t, n, r = !0, i = null) {
		let { screenWidth: a, screenHeight: o } = t;
		this.matrixVP.makeOrthographic(0, a, o, 0, -1, 1);
		for (let [e, n] of [[this.shadow, t.shadowTexture], [this.model, t.modelTexture]]) Zr(e.positions, n), e.material.uniforms._ScreenParams.value.set(a, o, 1 + 1 / a, 1 + 1 / o), e.material.uniformsNeedUpdate = !0;
		this.scene.background = n, e.setRenderTarget(i);
		let s = e.autoClear;
		e.autoClear = r, e.render(this.scene, this.camera), e.autoClear = s;
	}
	dispose() {
		for (let e of [this.shadow, this.model]) e.mesh.geometry.dispose(), e.material.dispose();
	}
};
function Zr(e, t) {
	let n = t.x, r = t.y, i = t.x + t.width, a = t.y + t.height;
	e.array.set([
		n,
		r,
		0,
		n,
		a,
		0,
		i,
		a,
		0,
		i,
		r,
		0
	]), e.needsUpdate = !0;
}
//#endregion
//#region src/engine/official/characterModelMaterials.ts
function Qr(e) {
	let t = e.toLowerCase();
	return t === "mtl_chr_00" ? 0 : t === "mtl_chr_eye_00" ? 1 : t === "mtl_chr_eyebrow_00" ? 2 : t === "mtl_chr_eyelash_00" ? 3 : t === "mtl_chr_ehl_00" ? 4 : t === "mtl_chr_hair_00" ? 5 : /mtl_bdy_[0-9]+/.test(t) ? 6 : /mtl_chr_acc_[0-9]+/.test(t) ? 7 : 8;
}
function $r(e, t) {
	let n = {
		renderQueue: 2e3,
		baseStencil: {
			stencilRef: 0,
			readMask: 255,
			writeMask: 255,
			comp: 8,
			pass: 2,
			fail: 0,
			zFail: 0
		},
		overlayStencil: {
			stencilRef: 0,
			readMask: 255,
			writeMask: 255,
			comp: 0,
			pass: 0,
			fail: 0,
			zFail: 0
		}
	};
	switch (e) {
		case 1:
		case 2:
		case 3: {
			let r = 1 << t >>> 0;
			n.renderQueue = e === 1 ? 2002 : 2001, n.baseStencil.stencilRef = 255, n.baseStencil.writeMask = r, n.overlayStencil = {
				stencilRef: r,
				readMask: r,
				writeMask: r,
				comp: 3,
				pass: 1,
				fail: 0,
				zFail: 0
			};
			break;
		}
		case 5:
			n.renderQueue = 2451, n.baseStencil.writeMask = ~(1 << t) & 255;
			break;
	}
	return n;
}
var ei = (e) => e | 0;
function ti(e) {
	let [t, n, r, i] = e, a = 2 * (i * t - n * r), o = Math.max(-1, Math.min(1, a)), s = Math.asin(o), c, l;
	Math.abs(o) < .9999999 ? (c = Math.atan2(2 * (i * n + t * r), 1 - 2 * (t * t + n * n)), l = Math.atan2(2 * (i * r + t * n), 1 - 2 * (t * t + r * r))) : (c = Math.atan2(-2 * (t * r - i * n), 1 - 2 * (n * n + r * r)), l = 0);
	let u = (e) => {
		let t = e * 180 / Math.PI;
		return t < 0 ? t + 360 : t >= 360 ? t - 360 : t;
	};
	return [
		u(s),
		u(c),
		u(l)
	];
}
function ni(e, t) {
	let n = Math.sqrt(e * e + t * t);
	return n > 1e-5 ? [e / n, t / n] : [0, 0];
}
var ri = class {
	head;
	renderers;
	face;
	acc;
	rendererFormationId = 0;
	stencilFormationId = -1;
	directionalLightRotation = null;
	characterDirectionalLightData = null;
	characterAction = [];
	skin = null;
	constructor(e, t) {
		this.head = t, this.renderers = e, this.face = [...e].reverse().find((e) => e.gameObjectName === "Face"), this.acc = [...e].reverse().find((e) => e.gameObjectName === "Acc");
	}
	*allMaterials() {
		for (let e of this.renderers) for (let t of e.materials) yield t;
	}
	setupRenderQueueAndStencil() {
		for (let { state: e, type: t } of this.allMaterials()) {
			let n = $r(t, this.stencilFormationId >= 0 ? this.stencilFormationId : this.rendererFormationId);
			e.renderQueue = ei(n.renderQueue);
			let r = n.baseStencil;
			e.setInt("_Stencil", ei(r.stencilRef)), e.setInt("_ReadMask", ei(r.readMask)), e.setInt("_WriteMask", ei(r.writeMask)), e.setInt("_StencilComp", r.comp), e.setInt("_StencilOp", r.pass), e.setInt("_StencilFail", r.fail), e.setInt("_StencilZFail", r.zFail);
			let i = n.overlayStencil;
			e.setInt("_EyelashStencil", ei(i.stencilRef)), e.setInt("_EyelashReadMask", ei(i.readMask)), e.setInt("_EyelashWriteMask", ei(i.writeMask)), e.setInt("_EyelashStencilComp", i.comp), e.setInt("_EyelashStencilOp", i.pass), e.setInt("_EyelashStencilFail", i.fail), e.setInt("_EyelashStencilZFail", i.zFail);
		}
	}
	setupFormation(e) {
		this.rendererFormationId = e;
		for (let { state: e } of this.allMaterials()) e.setInt("_CharacterId", this.rendererFormationId);
		this.setupRenderQueueAndStencil();
	}
	setupDirectionalLight(e, t) {
		this.directionalLightRotation = e, this.characterDirectionalLightData = t, this.characterAction.length === 0 && this.characterAction.push(() => this.setupFaceShadowAction());
	}
	addCharacterAction(e) {
		this.characterAction.push(e);
	}
	updateReflection() {
		for (let { state: e } of this.allMaterials()) e.setInt("_CharacterReflectionOff", 0);
	}
	setupDitherTexture(e) {
		for (let { state: t } of this.allMaterials()) t.setTexture("_DitherTex", e);
	}
	setupAccessoryMaterial() {
		if (!(!this.acc || this.acc.materials.length === 0)) for (let { state: e } of this.acc.materials) e.hasFloat("_IsAccessory") && e.setFloat("_IsAccessory", 1);
	}
	setupSkin(e, t, n) {
		this.skin = [
			e,
			t,
			n
		];
		for (let { state: r } of this.allMaterials()) r.setColor("_DefaultSkinColor", e), r.setColor("_Shadow1SkinColor", t), r.setColor("_Shadow2SkinColor", n);
	}
	update() {
		this.updateEyelashData(), this.updateCharacterMaterialParameters();
		for (let e of this.characterAction) e();
	}
	updateEyelashData() {
		let e = this.head();
		if (!e || !this.face) return;
		let t = lr(e.rotation);
		for (let { state: e } of this.face.materials) e.setVector("_FaceFront", t[0], t[1], t[2], 0);
	}
	updateCharacterMaterialParameters() {
		let e = this.characterDirectionalLightData;
		if (e) for (let { state: t } of this.allMaterials()) if (t.setFloat("_ShadowTexWeight", e.shadowTexWeight), e.useShadowFade ? (t.setInt("_FadeMode", e.fade), t.setFloat("_ShadowWidth", e.shadowWidth)) : t.setFloat("_ShadowWidth", 0), e.useHsvControl) {
			let n = Math.fround(e.hue * Math.fround(Math.PI)), r = Math.fround(n + n);
			t.setFloat("_HueSinAngle", Math.sin(r)), t.setFloat("_HueCosAngle", Math.cos(r)), t.setFloat("_Saturation", e.saturation), t.setFloat("_Value", e.value), t.setFloat("_Contrast", e.contrast);
		} else t.setFloat("_HueSinAngle", 0), t.setFloat("_HueCosAngle", 1), t.setFloat("_Saturation", .5), t.setFloat("_Value", .5), t.setFloat("_Contrast", .5);
	}
	setupFaceShadowAction() {
		let e = this.head(), t = this.characterDirectionalLightData;
		if (!e || !t || !this.directionalLightRotation || !this.face) return;
		let n = cr(e.rotation, [
			0,
			1,
			0
		]), r = ni(-n[0], -n[2]), i = ti(e.rotation)[1], a = this.directionalLightRotation(), o = lr(a), s = ni(o[0], o[2]), c = ti(a)[1], l = Math.fround(Math.abs(Math.abs(c - i) - 180) / -180 + 1), u = r[0] * s[0] + r[1] * s[1];
		for (let { state: e } of this.face.materials) t.useFaceShadowLimiter ? e.enableKeyword("_FACE_SHADOW_RANGE_LIMIT") : e.disableKeyword("_FACE_SHADOW_RANGE_LIMIT"), e.setFloat("_RangeLimit", t.faceShadowLimitRange), e.setVector("_HeadDotDirectionalLightValues", u, l, 0, 0);
	}
	get skinColors() {
		return this.skin;
	}
}, ii = new Uint8Array([
	165,
	105,
	150,
	90,
	45,
	225,
	30,
	210,
	135,
	75,
	180,
	120,
	15,
	195,
	60,
	240
]), ai = null;
function oi() {
	if (!ai) {
		let e = new y.DataTexture(ii, 4, 4, y.RedFormat, y.UnsignedByteType);
		e.name = "BayerMatrix", e.magFilter = y.NearestFilter, e.minFilter = y.NearestFilter, e.wrapS = y.RepeatWrapping, e.wrapT = y.RepeatWrapping, e.generateMipmaps = !1, e.flipY = !1, e.unpackAlignment = 1, e.colorSpace = y.NoColorSpace, e.needsUpdate = !0, ai = e;
	}
	return ai;
}
var si = {
	white: [
		255,
		255,
		255,
		255
	],
	black: [
		0,
		0,
		0,
		0
	],
	gray: [
		128,
		128,
		128,
		128
	],
	grey: [
		128,
		128,
		128,
		128
	],
	bump: [
		128,
		128,
		255,
		128
	],
	red: [
		255,
		0,
		0,
		0
	]
}, ci = /* @__PURE__ */ new Map();
function li(e) {
	let t = (e || "gray").toLowerCase(), n = si[t];
	if (!n) throw Error(`unknown Unity default texture "${e}"`);
	let r = ci.get(t);
	return r || (r = new y.DataTexture(new Uint8Array(n), 1, 1, y.RGBAFormat, y.UnsignedByteType), r.name = `unity_default_${t}`, r.magFilter = y.NearestFilter, r.minFilter = y.NearestFilter, r.generateMipmaps = !1, r.colorSpace = y.NoColorSpace, r.needsUpdate = !0, ci.set(t, r)), r;
}
//#endregion
//#region src/engine/official/officialCharacterRenderer.ts
var ui = [
	{
		name: "OpaqueForward",
		lightMode: "SRPDEFAULTUNLIT",
		queue: [0, 2500],
		opaqueSort: !0
	},
	{
		name: "OpaqueOutline",
		lightMode: "SEKAIOUTLINE",
		queue: [0, 2500],
		opaqueSort: !0
	},
	{
		name: "TransparentForward",
		lightMode: "SRPDEFAULTUNLIT",
		queue: [2501, 5e3],
		opaqueSort: !1
	},
	{
		name: "Eyelash",
		lightMode: "SEKAIEYELASH",
		queue: [2001, 2450],
		opaqueSort: !0
	}
], di = new y.Matrix4().makeScale(-1, 1, 1);
function fi(e) {
	return (e.tags.LIGHTMODE ?? e.tags.LightMode ?? "SRPDefaultUnlit").toUpperCase();
}
var pi = new y.MeshBasicMaterial({ visible: !1 }), mi = /* @__PURE__ */ new WeakMap();
function hi(e, t) {
	let n = mi.get(e);
	if (!n) {
		let r = e.getAttribute("position").count, i = Math.min(r, 4096), a = Math.ceil(r / i), o = new Float32Array(i * a * t.length * 4);
		t.forEach((e, t) => {
			for (let n = 0; n < r; n++) {
				let r = (t * i * a + n) * 4;
				o[r] = e.getX(n), o[r + 1] = e.getY(n), o[r + 2] = e.getZ(n);
			}
		}), n = new y.DataArrayTexture(o, i, a, t.length), n.format = y.RGBAFormat, n.type = y.FloatType, n.magFilter = y.NearestFilter, n.minFilter = y.NearestFilter, n.needsUpdate = !0, mi.set(e, n);
	}
	return n;
}
var gi = class {
	sources;
	globals;
	root = new y.Group();
	items = [];
	sourceFilter = null;
	scratch = {
		objectToWorld: new y.Matrix4(),
		worldToObject: new y.Matrix4(),
		objectFromMesh: new y.Matrix4(),
		view: new y.Matrix4(),
		viewProjection: new y.Matrix4(),
		camera: new y.Vector3(),
		center: new y.Vector3(),
		box: new y.Box3(),
		viewport: new y.Vector4()
	};
	constructor(e, t) {
		this.sources = e, this.globals = t;
		let n = 0;
		for (let r of e) {
			for (let e of r.slots) {
				let i = xn(e.state.table, t.maximumLOD);
				for (let t of i.passes) {
					let i = fi(t);
					ui.forEach((a, o) => {
						if (a.lightMode !== i || t.variants.length === 0) return;
						let s = this.createItem(r, e.slotIndex, e.state, t, o, n++);
						this.items.push(s);
					});
				}
			}
			let e = r.mesh.material;
			r.mesh.material = Array.isArray(e) ? e.map(() => pi) : pi;
		}
	}
	createItem(e, t, n, r, i, a) {
		let o = this.buildPassMaterial(e, n, r), s = e.mesh.geometry, c = s.groups.length ? s.groups.map((e) => e.materialIndex === t ? o.material : pi) : [o.material], l;
		if (e.mesh.isSkinnedMesh) {
			let t = e.mesh, n = new y.SkinnedMesh(s, c);
			n.bindMode = t.bindMode, n.bind(t.skeleton, t.bindMatrix), l = n;
		} else l = new y.Mesh(s, c);
		l.name = `${e.mesh.name}#${t}:${r.name}`, l.matrixAutoUpdate = !1, l.frustumCulled = !1, l.morphTargetInfluences = e.mesh.morphTargetInfluences, l.morphTargetDictionary = e.mesh.morphTargetDictionary, e.mesh.add(l);
		let u = {
			object: l,
			feature: i,
			state: n,
			pass: r,
			passMaterial: o,
			keywordKey: [...n.enabledKeywords].sort().join(" "),
			source: e,
			slotIndex: t,
			creation: a
		};
		return l.onBeforeRender = (e, t, n) => this.feedUniforms(e, n, u), u;
	}
	buildPassMaterial(e, t, n) {
		let r = e.mesh.geometry, i = r.morphAttributes.tangent, a = r.morphAttributes.position?.length ? {
			count: r.morphAttributes.position.length,
			stride: 1 + +!!r.morphAttributes.normal + +!!r.morphAttributes.color,
			normals: !!r.morphAttributes.normal,
			tangents: !!i?.length
		} : null;
		if (r.morphAttributes.color) throw Error(`${e.mesh.name}: blend-shape vertex colors are not supported`);
		let o = Fn(t.table, n, t.enabledKeywords, {
			skinning: !!e.mesh.isSkinnedMesh,
			morphTargets: a
		}, {
			float: (e) => t.getFloat(e),
			color: (e) => t.getColor(e)
		}), s = o.material.uniforms;
		if (i?.length && o.material.vertexShader.includes("harukiMorphTangentTexture")) {
			let e = hi(r, i);
			s.harukiMorphTangentTexture = { value: e }, s.harukiMorphTangentTextureSize = { value: new y.Vector2(e.image.width, e.image.height) };
		}
		return o;
	}
	setSourceFilter(e) {
		this.sourceFilter = e;
	}
	prepare(e) {
		e.getWorldPosition(this.scratch.camera);
		for (let e of this.items) {
			let t = [...e.state.enabledKeywords].sort().join(" ");
			if (t !== e.keywordKey) {
				let n = e.passMaterial.material;
				e.passMaterial = this.buildPassMaterial(e.source, e.state, e.pass);
				let r = e.object.material;
				for (let t = 0; t < r.length; t++) r[t] === n && (r[t] = e.passMaterial.material);
				n.dispose(), e.keywordKey = t;
			}
		}
		let t = /* @__PURE__ */ new Map();
		for (let e of this.items) {
			let n = e.source.mesh.geometry;
			n.boundingBox || n.computeBoundingBox(), this.scratch.box.copy(n.boundingBox).applyMatrix4(e.source.mesh.matrixWorld), this.scratch.box.getCenter(this.scratch.center), t.set(e, this.scratch.center.distanceToSquared(this.scratch.camera));
		}
		let n = [...this.items].sort((e, n) => {
			if (e.feature !== n.feature) return e.feature - n.feature;
			if (e.state.renderQueue !== n.state.renderQueue) return e.state.renderQueue - n.state.renderQueue;
			let r = ui[e.feature].opaqueSort, i = (t.get(e) ?? 0) - (t.get(n) ?? 0);
			return i === 0 ? e.creation - n.creation : r ? i : -i;
		}), r = this.sourceFilter;
		n.forEach((e, t) => {
			let n = ui[e.feature], i = e.state.renderQueue;
			e.object.visible = i >= n.queue[0] && i <= n.queue[1] && (r === null || r(e.source)), e.object.renderOrder = t;
		});
	}
	feedUniforms(e, t, n) {
		let r = this.scratch, i = n.passMaterial.material, a = i.uniforms, o = n.source, s = (o.rootBone ?? o.mesh).matrixWorld;
		r.objectToWorld.multiplyMatrices(di, s).multiply(di), r.worldToObject.copy(r.objectToWorld).invert(), r.objectFromMesh.copy(s).invert().premultiply(di).multiply(o.mesh.matrixWorld), a.harukiUnityObjectFromMesh.value.copy(r.objectFromMesh), a.harukiHasVertexColor.value = +!!o.mesh.geometry.getAttribute("color"), r.view.multiplyMatrices(t.matrixWorldInverse, di), r.viewProjection.multiplyMatrices(t.projectionMatrix, r.view), t.getWorldPosition(r.camera), e.getViewport(r.viewport);
		let c = t, l = c.near ?? .1, u = c.far ?? 1e3, d = r.viewport.z, f = r.viewport.w;
		for (let e of n.passMaterial.uniforms) this.assign(a[e.name], e, n.state, {
			hlslcc_mtx4x4unity_ObjectToWorld: r.objectToWorld.elements,
			hlslcc_mtx4x4unity_WorldToObject: r.worldToObject.elements,
			hlslcc_mtx4x4unity_MatrixV: r.view.elements,
			hlslcc_mtx4x4unity_MatrixVP: r.viewProjection.elements,
			_WorldSpaceCameraPos: [
				-r.camera.x,
				r.camera.y,
				r.camera.z
			],
			_ProjectionParams: [
				1,
				l,
				u,
				1 / u
			],
			_ScreenParams: [
				d,
				f,
				1 + 1 / d,
				1 + 1 / f
			],
			_ZBufferParams: [
				1 - u / l,
				u / l,
				(1 - u / l) / u,
				u / l / u
			],
			unity_OrthoParams: [
				0,
				0,
				0,
				+!!t.isOrthographicCamera
			],
			_GlobalMipBias: [0, 1]
		});
		i.uniformsNeedUpdate = !0;
	}
	assign(e, t, n, r) {
		if (!e) return;
		let i = t.name, a = r[i];
		if (a) {
			_i(e, t, a);
			return;
		}
		if (t.type.startsWith("sampler")) {
			let t = n.getTexture(i), r = this.globals.get(i);
			e.value = t ? t.texture ?? li(t.defaultName) : r instanceof y.Texture ? r : li("gray");
			return;
		}
		if (i.endsWith("_ST")) {
			let r = n.getTexture(i.slice(0, -3));
			if (r) {
				_i(e, t, r.scaleOffset);
				return;
			}
		}
		let o = n.getFloat(i);
		if (o !== null && !t.arraySize) {
			_i(e, t, [o]);
			return;
		}
		let s = n.getColor(i);
		if (s && !t.arraySize) {
			_i(e, t, s);
			return;
		}
		let c = this.globals.get(i);
		c !== void 0 && !(c instanceof y.Texture) && _i(e, t, typeof c == "number" ? [c] : c);
	}
	dispose() {
		for (let e of this.items) e.object.removeFromParent(), e.passMaterial.material.dispose();
		this.items.length = 0;
	}
};
function _i(e, t, n) {
	let r = e.value;
	if (typeof r == "number") {
		e.value = t.type === "int" ? Math.trunc(n[0] ?? 0) : n[0] ?? 0;
		return;
	}
	if (r instanceof Float32Array || r instanceof Int32Array) {
		let e = Math.min(r.length, n.length);
		for (let i = 0; i < e; i++) r[i] = t.type.startsWith("i") ? Math.trunc(n[i]) : n[i];
		return;
	}
	r instanceof y.Vector4 ? r.set(n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, n[3] ?? 0) : r instanceof y.Vector3 ? r.set(n[0] ?? 0, n[1] ?? 0, n[2] ?? 0) : r instanceof y.Vector2 && r.set(n[0] ?? 0, n[1] ?? 0);
}
//#endregion
//#region src/engine/official/officialMaterialState.ts
var vi = class {
	table;
	name;
	renderQueue;
	floats = /* @__PURE__ */ new Map();
	colors = /* @__PURE__ */ new Map();
	textures = /* @__PURE__ */ new Map();
	keywords = /* @__PURE__ */ new Set();
	version = 0;
	constructor(e, t, n, r) {
		this.table = e, this.name = t, this.renderQueue = n && n.customRenderQueue >= 0 ? n.customRenderQueue : yi(e);
		for (let t of e.properties) Array.isArray(t.default) ? this.colors.set(t.name, t.default.slice(0, 4)) : typeof t.default == "number" ? this.floats.set(t.name, t.default) : this.textures.set(t.name, {
			texture: null,
			scaleOffset: [
				1,
				1,
				0,
				0
			],
			defaultName: t.default.name
		});
		for (let e of n?.floatProperties ?? []) this.floats.set(e.name, e.value);
		for (let e of n?.intProperties ?? []) this.floats.set(e.name, e.value);
		for (let e of n?.colorProperties ?? []) this.colors.set(e.name, [
			e.r,
			e.g,
			e.b,
			e.a
		]);
		for (let e of n?.textureProperties ?? []) this.textures.set(e.name, {
			texture: r(e.name),
			scaleOffset: [
				e.scaleX,
				e.scaleY,
				e.offsetX,
				e.offsetY
			],
			defaultName: this.textures.get(e.name)?.defaultName ?? "gray"
		});
		for (let e of [...n?.validKeywords ?? [], ...n?.invalidKeywords ?? []]) this.keywords.add(e);
	}
	get revision() {
		return this.version;
	}
	get enabledKeywords() {
		return this.keywords;
	}
	hasFloat(e) {
		return this.floats.has(e);
	}
	getFloat(e) {
		return this.floats.get(e) ?? null;
	}
	getColor(e) {
		return this.colors.get(e) ?? null;
	}
	getTexture(e) {
		return this.textures.get(e) ?? null;
	}
	setFloat(e, t) {
		this.floats.set(e, Math.fround(t)), this.version++;
	}
	setInt(e, t) {
		this.setFloat(e, Math.trunc(t));
	}
	setColor(e, t) {
		this.colors.set(e, [
			t.r,
			t.g,
			t.b,
			t.a
		]), this.version++;
	}
	setVector(e, t, n, r, i) {
		this.colors.set(e, [
			t,
			n,
			r,
			i
		]), this.version++;
	}
	setTexture(e, t) {
		let n = this.textures.get(e);
		this.textures.set(e, {
			texture: t,
			scaleOffset: n ? n.scaleOffset : [
				1,
				1,
				0,
				0
			],
			defaultName: n?.defaultName ?? "gray"
		}), this.version++;
	}
	setTextureOffset(e, t, n) {
		let r = this.textures.get(e);
		if (!r) throw Error(`${this.name}: no texture property ${e}`);
		r.scaleOffset = [
			r.scaleOffset[0],
			r.scaleOffset[1],
			t,
			n
		], this.version++;
	}
	enableKeyword(e) {
		this.keywords.has(e) || (this.keywords.add(e), this.version++);
	}
	disableKeyword(e) {
		this.keywords.delete(e) && this.version++;
	}
};
function yi(e) {
	let t = e.subShaders[0]?.tags.QUEUE ?? e.subShaders[0]?.tags.Queue;
	if (!t) return 2e3;
	let n = /^(Background|Geometry|AlphaTest|Transparent|Overlay)([+-]\d+)?$/i.exec(t);
	if (!n) throw Error(`${e.shader}: unknown Queue tag ${t}`);
	return {
		background: 1e3,
		geometry: 2e3,
		alphatest: 2450,
		transparent: 3e3,
		overlay: 4e3
	}[n[1].toLowerCase()] + (n[2] ? Number(n[2]) : 0);
}
//#endregion
//#region src/engine/official/sekaiCharacterEye.ts
function bi(e) {
	if (e.tileX !== 0 && e.tileY !== 0) {
		let t = Math.trunc(e.sample % e.tileX), n = Math.trunc(e.sample / e.tileY);
		return [Math.fround(t / e.tileX), Math.fround(1 - Math.fround(n / e.tileY))];
	}
	return [0, 0];
}
var xi = ["BS_eye.eye_close", "BS_eye.eye_wink_L"], Si = ["BS_eye.eye_close", "BS_eye.eye_wink_R"];
function Ci(e) {
	return !Number.isInteger(e) || e < 1 || e > 31 ? null : e === 14 ? {
		left: [],
		right: []
	} : e === 22 ? {
		left: ["BS_eye.eye_close"],
		right: ["BS_eye.eye_close"]
	} : {
		left: [...xi],
		right: [...Si]
	};
}
var wi = "Sekai/Live/Character/Eye-Base", Ti = "Sekai/Live/Character/Eye-Highlight", Ei = class {
	lightInfluence;
	lightInfluenceForEyeHighlight;
	lightInfluenceShaderParam = 1;
	lightInfluenceForEyeHighlightShaderParam = 1;
	tintColor;
	emissionColor;
	baseTiling;
	highlightTiling;
	leftEyeCloseBlendShapeValue = 0;
	rightEyeCloseBlendShapeValue = 0;
	baseMaterial = null;
	highlightMaterial = null;
	eyelashMaterial = null;
	blendShapeIndexTable = null;
	eyeRenderer = null;
	characterEyeActions = [];
	updateError = null;
	constructor(e) {
		this.lightInfluence = e.lightInfluence, this.lightInfluenceForEyeHighlight = e.lightInfluenceForEyeHighlight, this.tintColor = e.tintColor, this.emissionColor = e.emissionColor, this.baseTiling = e.baseTiling, this.highlightTiling = e.highlightTiling;
	}
	setup(e, t, n) {
		let r = Ci(t);
		r && (this.blendShapeIndexTable = {
			leftEyeClose: r.left.map((t) => e.blendShapeIndex(t)),
			rightEyeClose: r.right.map((t) => e.blendShapeIndex(t))
		}, this.eyeRenderer = e, this.getMaterials(e), this.lightInfluence = 1, this.lightInfluenceForEyeHighlight = 1, (n === "MusicVideo" || n === "Gacha") && this.characterEyeActions.push(() => this.updateLightInfluenceShaderParams()));
	}
	getMaterials(e) {
		for (let t of e.materials) t && (this.eyelashMaterial === null && t.name.includes("Eyelash") && (this.eyelashMaterial = t.state), t.shader === wi ? this.baseMaterial = t.state : t.shader === Ti && (this.highlightMaterial = t.state));
	}
	update() {
		this.updateError = null, this.getBlendShapeValue();
		let e = this.require(this.baseMaterial, "baseMaterial");
		if (!e) return;
		e.setTextureOffset("_MainTex", ...bi(this.baseTiling));
		let t = this.require(this.highlightMaterial, "highlightMaterial");
		if (!t) return;
		t.setTextureOffset("_MainTex", ...bi(this.highlightTiling)), e.setColor("_TintColor", this.tintColor), t.setColor("_TintColor", this.tintColor), t.setColor("_EmissionColor", this.emissionColor);
		let n = +(this.leftEyeCloseBlendShapeValue >= Math.fround(99.9)), r = +(this.rightEyeCloseBlendShapeValue >= Math.fround(99.9));
		e.setInt("_IsLeftEyeClose", n), t.setInt("_IsLeftEyeClose", n);
		let i = this.require(this.eyelashMaterial, "eyelashMaterial");
		if (i) {
			i.setInt("_IsLeftEyeClose", n), e.setInt("_IsRightEyeClose", r), t.setInt("_IsRightEyeClose", r), i.setInt("_IsRightEyeClose", r);
			for (let e of this.characterEyeActions) e();
			e.setFloat("_LightInfluence", this.lightInfluenceShaderParam), t.setFloat("_LightInfluenceForEyeHighlight", this.lightInfluenceForEyeHighlightShaderParam);
		}
	}
	require(e, t) {
		return e || (this.updateError = `SekaiCharacterEye.Update: ${t} is null (NullReferenceException)`), e;
	}
	getBlendShapeValue() {
		let e = this.blendShapeIndexTable, t = this.eyeRenderer;
		if (!(!e || !t)) {
			this.leftEyeCloseBlendShapeValue = 0, this.rightEyeCloseBlendShapeValue = 0;
			for (let n of e.leftEyeClose) {
				let e = t.blendShapeWeight(n);
				this.leftEyeCloseBlendShapeValue < e && (this.leftEyeCloseBlendShapeValue = e);
			}
			for (let n of e.rightEyeClose) {
				let e = t.blendShapeWeight(n);
				this.rightEyeCloseBlendShapeValue < e && (this.rightEyeCloseBlendShapeValue = e);
			}
		}
	}
	updateLightInfluenceShaderParams() {
		this.lightInfluenceShaderParam = this.lightInfluence, this.lightInfluenceForEyeHighlightShaderParam = this.lightInfluenceForEyeHighlight;
	}
}, Di = class {
	serialized;
	rendererMaterials;
	headTransform = null;
	materials = [];
	point = new y.Vector3();
	constructor(e, t) {
		this.serialized = e, this.rendererMaterials = t;
	}
	setup(e, t) {
		this.headTransform = e, this.materials = this.rendererMaterials();
		for (let e of this.materials) t ? (e.enableKeyword("_HAIR_SHADOW"), e.enableKeyword("_LAMBERT")) : (e.disableKeyword("_HAIR_SHADOW"), e.disableKeyword("_LAMBERT"));
	}
	onUpdate() {
		let e = this.headTransform?.();
		if (!e) return;
		let [t, n, r] = this.serialized.offset;
		e.updateWorldMatrix(!0, !1);
		let i = this.point.set(-t, n, r).applyMatrix4(e.matrixWorld);
		for (let e of this.materials) e.setVector("_HeadPosition", -i.x, i.y, i.z, 0);
	}
};
function Oi(e) {
	let t = ((e ?? {}).characterControllers ?? {}).hair;
	if (!t) return null;
	let n = t.offset, r = t.gameObject?.transformPathId;
	if (!n || typeof r != "number") throw Error("characterControllers.hair has no offset / GameObject transform");
	return {
		offset: [
			n.x,
			n.y,
			n.z
		],
		rendererTransformPathId: r
	};
}
//#endregion
//#region src/engine/official/installOfficialCharacter.ts
var ki = {
	"-1686991803859250934": "Sekai/Live/Character/Toon-v3",
	"7767892853644477195": "Sekai/Live/Character/Toon",
	"-6807573587472322990": "Sekai/Live/Accessory/Toon",
	"8569198743089531179": "Sekai/Live/Character/Eye-Base",
	"9183286861755933747": "Sekai/Live/Character/Eye-Highlight"
}, Ai = {
	"Sekai/Live/Character/Toon-v3": () => import("./Sekai_Live_Character_Toon-v3-XGZIb5UQ.js"),
	"Sekai/Live/Character/Toon": () => import("./Sekai_Live_Character_Toon-Dm8eHoZX.js"),
	"Sekai/Live/Accessory/Toon": () => import("./Sekai_Live_Accessory_Toon-LzVE9cS0.js"),
	"Sekai/Live/Character/Eye-Base": () => import("./Sekai_Live_Character_Eye-Base-DLHDyaOn.js"),
	"Sekai/Live/Character/Eye-Highlight": () => import("./Sekai_Live_Character_Eye-Highlight-B3sbvzqR.js")
}, ji = /* @__PURE__ */ new Map();
function Mi(e) {
	let t = ji.get(e);
	if (!t) {
		let n = Ai[e];
		if (!n) throw Error(`no official table for shader ${e}`);
		t = n().then((e) => e.default), ji.set(e, t);
	}
	return t;
}
function Ni(e) {
	if (e.shaderName) return e.shaderName;
	let t = ki[e.shaderKey?.match(/^ref:-?\d+:(-?\d+)$/)?.[1] ?? String(e.shaderPathId)];
	if (!t) throw Error(`unknown character shader reference ${e.shaderKey ?? e.shaderPathId}`);
	return t;
}
function Pi(e, t) {
	let n = (e) => {
		switch (e) {
			case 0: return y.RepeatWrapping;
			case 1: return y.ClampToEdgeWrapping;
			case 2: return y.MirroredRepeatWrapping;
			default: throw Error(`texture ${t.name}: Unity wrap mode ${e} has no WebGL sampler`);
		}
	};
	e.wrapS = n(t.wrapU), e.wrapT = n(t.wrapV);
	let r = t.sourceMipCount > 1;
	t.filterMode === 0 ? (e.magFilter = y.NearestFilter, e.minFilter = r ? y.NearestMipmapNearestFilter : y.NearestFilter) : (e.magFilter = y.LinearFilter, e.minFilter = r ? t.filterMode === 2 ? y.LinearMipmapLinearFilter : y.LinearMipmapNearestFilter : y.LinearFilter), e.anisotropy = Math.max(1, t.anisoLevel || 1);
}
var Fi = /* @__PURE__ */ new WeakMap();
async function Ii(e, t) {
	if (!t.uri) return null;
	let n = Fi.get(e);
	n || (n = /* @__PURE__ */ new Map(), Fi.set(e, n));
	let r = JSON.stringify([
		t.uri,
		t.wrapU,
		t.wrapV,
		t.filterMode,
		t.anisoLevel
	]), i = n.get(r);
	return i || (i = e.loadAsync(t.uri).then((e) => {
		let n = e.clone();
		return n.colorSpace = y.NoColorSpace, n.flipY = !1, Pi(n, t), n.needsUpdate = !0, n;
	}), n.set(r, i)), i;
}
function Li(e, t) {
	let n = e?.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
	return n ? {
		r: parseInt(n[1], 16) / 255,
		g: parseInt(n[2], 16) / 255,
		b: parseInt(n[3], 16) / 255,
		a: 1
	} : t;
}
function Ri(e) {
	let t = (e, t) => {
		if (!e || typeof e != "object") throw Error(`runtime extension has no ${t}`);
		return e;
	}, n = (e, t) => e[t] ?? e[t.charAt(0).toUpperCase() + t.slice(1)], r = (e, t, r) => {
		let i = n(e, t);
		if (typeof i != "number" || !Number.isFinite(i)) throw Error(`${r}.${t} is not a number`);
		return i;
	}, i = t(n(t(n(t(e, "runtime extension"), "characterControllers"), "characterControllers"), "eye"), "characterControllers.eye (SekaiCharacterEye)"), a = (e) => {
		let a = t(n(i, e), `SekaiCharacterEye.${e}`), o = `SekaiCharacterEye.${e}`;
		return {
			r: r(a, "r", o),
			g: r(a, "g", o),
			b: r(a, "b", o),
			a: r(a, "a", o)
		};
	}, o = (e) => {
		let a = t(n(i, e), `SekaiCharacterEye.${e}`), o = `SekaiCharacterEye.${e}`;
		return {
			tileX: r(a, "tileX", o),
			tileY: r(a, "tileY", o),
			sample: r(a, "sample", o)
		};
	};
	return {
		lightInfluence: r(i, "lightInfluence", "SekaiCharacterEye"),
		lightInfluenceForEyeHighlight: r(i, "lightInfluenceForEyeHighlight", "SekaiCharacterEye"),
		tintColor: a("tintColor"),
		emissionColor: a("emissionColor"),
		baseTiling: o("baseTiling"),
		highlightTiling: o("highlightTiling")
	};
}
async function zi(e) {
	let { root: t, textureLoader: n, globals: r } = e, i = e.materialSlots, a = /* @__PURE__ */ new Map(), o = [];
	await Promise.all(i.map(async (e) => {
		let t = e.rawMaterial;
		if (!t) throw Error(`material slot ${e.materialKey} has no raw material`);
		let i = await Mi(Ni(t));
		xn(i, r.maximumLOD);
		let s = /* @__PURE__ */ new Map();
		await Promise.all(t.textureProperties.map(async (e) => {
			s.set(e.name, await Ii(n, e));
		}));
		let c = new vi(i, e.materialName ?? "", t, (e) => s.get(e) ?? null);
		a.set(e.materialKey, c), o.push(c);
	}));
	let s = [], c = [], l = /* @__PURE__ */ new Map();
	for (let e of i) {
		let t = a.get(e.materialKey);
		t && e.rawMaterial && l.set(t, Ni(e.rawMaterial));
	}
	let u = null;
	t.updateMatrixWorld(!0), t.traverse((e) => {
		let t = e;
		if (!t.isMesh || !t.userData.pjskNativeUnityMesh) return;
		let n = Array.isArray(t.material) ? t.material : [t.material], r = [], i = [];
		n.forEach((e, n) => {
			let o = e.userData.pjskMaterialKey, s = typeof o == "string" ? a.get(o) : void 0;
			if (!s) throw Error(`mesh ${t.name} slot ${n}: material ${o} has no exported slot`);
			r.push({
				slotIndex: n,
				state: s
			}), i.push({
				state: s,
				type: Qr(s.name)
			});
		}), s.push({
			mesh: t,
			rootBone: t.userData.pjskUnityRootBone ?? null,
			slots: r
		}), !u && t.name.replace(/^.*:/, "") === "Face" && (u = {
			mesh: t,
			slots: r
		}), c.push({
			gameObjectName: t.name,
			materials: i
		});
	});
	let d = (e) => {
		let t = e.getWorldQuaternion(new y.Quaternion());
		return [
			t.x,
			-t.y,
			-t.z,
			t.w
		];
	}, f = new ri(c, () => {
		let t = e.headBone();
		return t ? { rotation: d(t) } : null;
	});
	f.setupFormation(0), f.setupDirectionalLight(() => e.directionalLight.transform.rotation, e.directionalLight.characterDirectionalLightData);
	let p = null, m = u;
	if (m) {
		p = new Ei(Ri(e.runtimeExtension));
		let t = m.mesh;
		p.setup({
			materials: m.slots.map(({ state: e }) => ({
				name: e.name,
				shader: l.get(e) ?? "",
				state: e
			})),
			blendShapeIndex: (e) => t.morphTargetDictionary?.[e] ?? -1,
			blendShapeWeight: (e) => {
				let n = t.morphTargetInfluences;
				return n && e >= 0 && e < n.length ? Math.fround(n[e] * 100) : 0;
			}
		}, e.characterId, "None");
	}
	f.updateReflection(), f.setupDitherTexture(oi()), f.setupAccessoryMaterial();
	let h = e.skinColors;
	if (!h) throw Error("installOfficialCharacter: the role's skin colors (gameCharacterUnits) are required");
	let g = {
		r: 1,
		g: 1,
		b: 1,
		a: 1
	};
	f.setupSkin(Li(h.default, g), Li(h.shadow1, g), Li(h.shadow2, g)), f.setupFormation(0);
	let _ = Oi(e.runtimeExtension);
	if (_) {
		let t = e.transformByPathId(_.rendererTransformPathId);
		if (!t) throw Error("SekaiCharacterHair renderer transform is not in the character");
		let n = new Di(_, () => s.filter((e) => e.mesh.parent === t).flatMap((e) => e.slots.map(({ state: e }) => e)));
		e.headBone() && n.setup(e.headBone, !0), f.addCharacterAction(() => n.onUpdate());
	}
	return {
		renderer: new gi(s, r),
		model: f,
		eye: p,
		states: o
	};
}
//#endregion
//#region src/engine/official/sekaiCharacterOutlinePass.ts
var Bi = {
	outlineWidthMin: .03999999910593033,
	outlineWidthMax: .949999988079071,
	outlineDistanceNear: .44999998807907104,
	outlineDistanceFar: 20,
	fovCurve: [{
		time: -.013763427734375,
		value: 27.81246566772461,
		outTangent: -.13214513659477234
	}, {
		time: 100.92341613769531,
		value: -.03620624542236328,
		inTangent: -.5713597536087036
	}]
};
function Vi(e) {
	let [t, n] = Bi.fovCurve;
	if (e <= t.time) return t.value;
	if (e >= n.time) return n.value;
	let r = n.time - t.time, i = (e - t.time) / r, a = i * i, o = a * i;
	return (2 * o - 3 * a + 1) * t.value + (o - 2 * a + i) * r * t.outTangent + (-2 * o + 3 * a) * n.value + (o - a) * r * n.inTangent;
}
function Hi(e, t, n = 1) {
	let r = Vi(t), i = Number.isFinite(n) && n > 0 ? n : 1;
	e.setVector("_SekaiOutlineWidth", Math.fround(Bi.outlineWidthMin * .01 * i), Math.fround(Bi.outlineWidthMax * .01 * i), 0, 0), e.setVector("_SekaiOutlineFactor", Bi.outlineDistanceNear, Math.fround(1 / (Bi.outlineDistanceFar - Bi.outlineDistanceNear)), Math.fround(t / r), 0);
}
//#endregion
//#region node_modules/three/examples/jsm/utils/WorkerPool.js
var Ui = class {
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
}, Wi = 1000066e3, Gi = class {
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
}, Ki = class {
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
var I = [
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
function qi(e) {
	return new TextDecoder().decode(e);
}
function Ji(e) {
	let t = new Uint8Array(e.buffer, e.byteOffset, I.length);
	if (t[0] !== I[0] || t[1] !== I[1] || t[2] !== I[2] || t[3] !== I[3] || t[4] !== I[4] || t[5] !== I[5] || t[6] !== I[6] || t[7] !== I[7] || t[8] !== I[8] || t[9] !== I[9] || t[10] !== I[10] || t[11] !== I[11]) throw Error("Missing KTX 2.0 identifier.");
	let n = new Gi(), r = 17 * Uint32Array.BYTES_PER_ELEMENT, i = new Ki(e, I.length, r, !0);
	n.vkFormat = i._nextUint32(), n.typeSize = i._nextUint32(), n.pixelWidth = i._nextUint32(), n.pixelHeight = i._nextUint32(), n.pixelDepth = i._nextUint32(), n.layerCount = i._nextUint32(), n.faceCount = i._nextUint32();
	let a = i._nextUint32();
	n.supercompressionScheme = i._nextUint32();
	let o = i._nextUint32(), s = i._nextUint32(), c = i._nextUint32(), l = i._nextUint32(), u = i._nextUint64(), d = i._nextUint64(), f = new Ki(e, I.length + r, 3 * a * 8, !0);
	for (let t = 0; t < a; t++) n.levels.push({
		levelData: new Uint8Array(e.buffer, e.byteOffset + f._nextUint64(), f._nextUint64()),
		uncompressedByteLength: f._nextUint64()
	});
	let p = new Ki(e, o, s, !0), m = {
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
	let g = new Ki(e, c, l, !0);
	for (; g._offset < l;) {
		let e = g._nextUint32(), t = g._scan(e), r = qi(t);
		if (n.keyValue[r] = g._nextUint8Array(e - t.byteLength - 1), r.match(/^ktx/i)) {
			let e = qi(n.keyValue[r]);
			n.keyValue[r] = e.substring(0, e.lastIndexOf("\0"));
		}
		g._skip(e % 4 ? 4 - e % 4 : 0);
	}
	if (d <= 0) return n;
	let _ = new Ki(e, u, d, !0), v = _._nextUint16(), y = _._nextUint16(), b = _._nextUint32(), x = _._nextUint32(), S = _._nextUint32(), ee = _._nextUint32(), C = [];
	for (let e = 0; e < a; e++) C.push({
		imageFlags: _._nextUint32(),
		rgbSliceByteOffset: _._nextUint32(),
		rgbSliceByteLength: _._nextUint32(),
		alphaSliceByteOffset: _._nextUint32(),
		alphaSliceByteLength: _._nextUint32()
	});
	let w = u + _._offset, te = w + b, T = te + x, ne = T + S;
	return n.globalData = {
		endpointCount: v,
		selectorCount: y,
		imageDescs: C,
		endpointsData: new Uint8Array(e.buffer, e.byteOffset + w, b),
		selectorsData: new Uint8Array(e.buffer, e.byteOffset + te, x),
		tablesData: new Uint8Array(e.buffer, e.byteOffset + T, S),
		extendedData: new Uint8Array(e.buffer, e.byteOffset + ne, ee)
	}, n;
}
//#endregion
//#region node_modules/three/examples/jsm/libs/zstddec.module.js
var Yi, Xi, Zi, Qi = { env: { emscripten_notify_memory_growth: function(e) {
	Zi = new Uint8Array(Xi.exports.memory.buffer);
} } }, $i = class {
	init() {
		return Yi || (Yi = typeof fetch < "u" ? fetch("data:application/wasm;base64," + ea).then((e) => e.arrayBuffer()).then((e) => WebAssembly.instantiate(e, Qi)).then(this._init) : WebAssembly.instantiate(Buffer.from(ea, "base64"), Qi).then(this._init), Yi);
	}
	_init(e) {
		Xi = e.instance, Qi.env.emscripten_notify_memory_growth(0);
	}
	decode(e, t = 0) {
		if (!Xi) throw Error("ZSTDDecoder: Await .init() before decoding.");
		let n = e.byteLength, r = Xi.exports.malloc(n);
		Zi.set(e, r), t ||= Number(Xi.exports.ZSTD_findDecompressedSize(r, n));
		let i = Xi.exports.malloc(t), a = Xi.exports.ZSTD_decompress(i, t, r, n), o = Zi.slice(i, i + a);
		return Xi.exports.free(r), Xi.exports.free(i), o;
	}
}, ea = "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IAMNACAEQQNxBEADQCACRQ0FIAAgAkF/aiICaiIDIAEgAmotAAA6AAAgA0EDcQ0ACwsgAkEDTQ0AA0AgACACQXxqIgJqIAEgAmooAgA2AgAgAkEDSw0ACwsgAkUNAgNAIAAgAkF/aiICaiABIAJqLQAAOgAAIAINAAsMAgsgAkEDTQ0AIAIhBANAIAMgASgCADYCACABQQRqIQEgA0EEaiEDIARBfGoiBEEDSw0ACyACQQNxIQILIAJFDQADQCADIAEtAAA6AAAgA0EBaiEDIAFBAWohASACQX9qIgINAAsLIAAL8wICAn8BfgJAIAJFDQAgACACaiIDQX9qIAE6AAAgACABOgAAIAJBA0kNACADQX5qIAE6AAAgACABOgABIANBfWogAToAACAAIAE6AAIgAkEHSQ0AIANBfGogAToAACAAIAE6AAMgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBfGogATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQXhqIAE2AgAgAkF0aiABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkFwaiABNgIAIAJBbGogATYCACACQWhqIAE2AgAgAkFkaiABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa0iBUIghiAFhCEFIAMgBGohAQNAIAEgBTcDGCABIAU3AxAgASAFNwMIIAEgBTcDACABQSBqIQEgAkFgaiICQR9LDQALCyAACy8BAn8gACgCBCAAKAIAQQJ0aiICLQACIQMgACACLwEAIAEgAi0AAxAIajYCACADCy8BAn8gACgCBCAAKAIAQQJ0aiICLQACIQMgACACLwEAIAEgAi0AAxAFajYCACADCx8AIAAgASACKAIEEAg2AgAgARAEGiAAIAJBCGo2AgQLCAAgAGdBH3MLugUBDX8jAEEQayIKJAACfyAEQQNNBEAgCkEANgIMIApBDGogAyAEEAsaIAAgASACIApBDGpBBBAVIgBBbCAAEAMbIAAgACAESxsMAQsgAEEAIAEoAgBBAXRBAmoQECENQVQgAygAACIGQQ9xIgBBCksNABogAiAAQQVqNgIAIAMgBGoiAkF8aiEMIAJBeWohDiACQXtqIRAgAEEGaiELQQQh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ASIDNgLE4AEgACgCvOABIQQgACABNgK84AEgACABIAJqNgK44AEgACABIAQgA2tqNgLA4AELpgEBAX8gACAAKALs4QEQFjYCyOABIABCADcD+OABIABCADcDuOABIABBwOABakIANwMAIABBqNAAaiIBQYyAgOAANgIAIABBADYCmOIBIABCADcDiOEBIABCAzcDgOEBIABBrNABakHgEikCADcCACAAQbTQAWpB6BIoAgA2AgAgACABNgIMIAAgAEGYIGo2AgggACAAQaAwajYCBCAAIABBEGo2AgALYQEBf0G4fyEDAkAgAUEDSQ0AIAIgABAhIgFBA3YiADYCCCACIAFBAXE2AgQgAiABQQF2QQNxIgM2AgACQCADQX9qIgFBAksNAAJAIAFBAWsOAgEAAgtBbA8LIAAhAwsgAwsMACAAIAEgAkEAEC4LiAQCA38CfiADEBYhBCAAQQBBKBAQIQAgBCACSwRAIAQPCyABRQRAQX8PCwJAAkAgA0EBRg0AIAEoAAAiBkGo6r5pRg0AQXYhAyAGQXBxQdDUtMIBRw0BQQghAyACQQhJDQEgAEEAQSgQECEAIAEoAAQhASAAQQE2AhQgACABrTcDAEEADwsgASACIAMQLyIDIAJLDQAgACADNgIYQXIhAyABIARqIgVBf2otAAAiAkEIcQ0AIAJBIHEiBkUEQEFwIQMgBS0AACIFQacBSw0BIAVBB3GtQgEgBUEDdkEKaq2GIgdCA4h+IAd8IQggBEEBaiEECyACQQZ2IQMgAkECdiEFAkAgAkEDcUF/aiICQQJLBEBBACECDAELAkACQAJAIAJBAWsOAgECAAsgASAEai0AACECIARBAWohBAwCCyABIARqLwAAIQIgBEECaiEEDAELIAEgBGooAAAhAiAEQQRqIQQLIAVBAXEhBQJ+AkACQAJAIANBf2oiA0ECTQRAIANBAWsOAgIDAQtCfyAGRQ0DGiABIARqMQAADAMLIAEgBGovAACtQoACfAwCCyABIARqKAAArQwBCyABIARqKQAACyEHIAAgBTYCICAAIAI2AhwgACAHNwMAQQAhAyAAQQA2AhQgACAHIAggBhsiBzcDCCAAIAdCgIAIIAdCgIAIVBs+AhALIAMLWwEBf0G4fyEDIAIQFiICIAFNBH8gACACakF/ai0AACIAQQNxQQJ0QaAeaigCACACaiAAQQZ2IgFBAnRBsB5qKAIAaiAAQSBxIgBFaiABRSAAQQV2cWoFQbh/CwsdACAAKAKQ4gEQWiAAQQA2AqDiASAAQgA3A5DiAQu1AwEFfyMAQZACayIKJABBuH8hBgJAIAVFDQAgBCwAACIIQf8BcSEHAkAgCEF/TARAIAdBgn9qQQF2IgggBU8NAkFsIQYgB0GBf2oiBUGAAk8NAiAEQQFqIQdBACEGA0AgBiAFTwRAIAUhBiAIIQcMAwUgACAGaiAHIAZBAXZqIgQtAABBBHY6AAAgACAGQQFyaiAELQAAQQ9xOgAAIAZBAmohBgwBCwAACwALIAcgBU8NASAAIARBAWogByAKEFMiBhADDQELIAYhBEEAIQYgAUEAQTQQECEJQQAhBQNAIAQgBkcEQCAAIAZqIggtAAAiAUELSwRAQWwhBgwDBSAJIAFBAnRqIgEgASgCAEEBajYCACAGQQFqIQZBASAILQAAdEEBdSAFaiEFDAILAAsLQWwhBiAFRQ0AIAUQFEEBaiIBQQxLDQAgAyABNgIAQQFBASABdCAFayIDEBQiAXQgA0cNACAAIARqIAFBAWoiADoAACAJIABBAnRqIgAgACgCAEEBajYCACAJKAIEIgBBAkkgAEEBcXINACACIARBAWo2AgAgB0EBaiEGCyAKQZACaiQAIAYLxhEBDH8jAEHwAGsiBSQAQWwhCwJAIANBCkkNACACLwAAIQogAi8AAiEJIAIvAAQhByAFQQhqIAQQDgJAIAMgByAJIApqakEGaiIMSQ0AIAUtAAohCCAFQdgAaiACQQZqIgIgChAGIgsQAw0BIAVBQGsgAiAKaiICIAkQBiILEAMNASAFQShqIAIgCWoiAiAHEAYiCxADDQEgBUEQaiACIAdqIAMgDGsQBiILEAMNASAAIAFqIg9BfWohECAEQQRqIQZBASELIAAgAUEDakECdiIDaiIMIANqIgIgA2oiDiEDIAIhBCAMIQcDQCALIAMgEElxBEAgACAGIAVB2ABqIAgQAkECdGoiCS8BADsAACAFQdgAaiAJLQACEAEgCS0AAyELIAcgBiAFQUBrIAgQAkECdGoiCS8BADsAACAFQUBrIAktAAIQASAJLQADIQogBCAGIAVBKGogCBACQQJ0aiIJLwEAOwAAIAVBKGogCS0AAhABIAktAAMhCSADIAYgBUEQaiAIEAJBAnRqIg0vAQA7AAAgBUEQaiANLQACEAEgDS0AAyENIAAgC2oiCyAGIAVB2ABqIAgQAkECdGoiAC8BADsAACAFQdgAaiAALQACEAEgAC0AAyEAIAcgCmoiCiAGIAVBQGsgCBACQQJ0aiIHLwEAOwAAIAVBQGsgBy0AAhABIActAAMhByAEIAlqIgkgBiAFQShqIAgQAkECdGoiBC8BADsAACAFQShqIAQtAAIQASAELQADIQQgAyANaiIDIAYgBUEQaiAIEAJBAnRqIg0vAQA7AAAgBUEQaiANLQACEAEgACALaiEAIAcgCmohByAEIAlqIQQgAyANLQADaiEDIAVB2ABqEA0gBUFAaxANciAFQShqEA1yIAVBEGoQDXJFIQsMAQsLIAQgDksgByACS3INAEFsIQsgACAMSw0BIAxBfWohCQNAQQAgACAJSSAFQdgAahAEGwRAIAAgBiAFQdgAaiAIEAJBAnRqIgovAQA7AAAgBUHYAGogCi0AAhABIAAgCi0AA2oiACAGIAVB2ABqIAgQAkECdGoiCi8BADsAACAFQdgAaiAKLQACEAEgACAKLQADaiEADAEFIAxBfmohCgNAIAVB2ABqEAQgACAKS3JFBEAgACAGIAVB2ABqIAgQAkECdGoiCS8BADsAACAFQdgAaiAJLQACEAEgACAJLQADaiEADAELCwNAIAAgCk0EQCAAIAYgBUHYAGogCBACQQJ0aiIJLwEAOwAAIAVB2ABqIAktAAIQASAAIAktAANqIQAMAQsLAkAgACAMTw0AIAAgBiAFQdgAaiAIEAIiAEECdGoiDC0AADoAACAMLQADQQFGBEAgBUHYAGogDC0AAhABDAELIAUoAlxBH0sNACAFQdgAaiAGIABBAnRqLQACEAEgBSgCXEEhSQ0AIAVBIDYCXAsgAkF9aiEMA0BBACAHIAxJIAVBQGsQBBsEQCAHIAYgBUFAayAIEAJBAnRqIgAvAQA7AAAgBUFAayAALQACEAEgByAALQADaiIAIAYgBUFAayAIEAJBAnRqIgcvAQA7AAAgBUFAayAHLQACEAEgACAHLQADaiEHDAEFIAJBfmohDANAIAVBQGsQBCAHIAxLckUEQCAHIAYgBUFAayAIEAJBAnRqIgAvAQA7AAAgBUFAayAALQACEAEgByAALQADaiEHDAELCwNAIAcgDE0EQCAHIAYgBUFAayAIEAJBAnRqIgAvAQA7AAAgBUFAayAALQACEAEgByAALQADaiEHDAELCwJAIAcgAk8NACAHIAYgBUFAayAIEAIiAEECdGoiAi0AADoAACACLQADQQFGBEAgBUFAayACLQACEAEMAQsgBSgCREEfSw0AIAVBQGsgBiAAQQJ0ai0AAhABIAUoAkRBIUkNACAFQSA2AkQLIA5BfWohAgNAQQAgBCACSSAFQShqEAQbBEAgBCAGIAVBKGogCBACQQJ0aiIALwEAOwAAIAVBKGogAC0AAhABIAQgAC0AA2oiACAGIAVBKGogCBACQQJ0aiIELwEAOwAAIAVBKGogBC0AAhABIAAgBC0AA2ohBAwBBSAOQX5qIQIDQCAFQShqEAQgBCACS3JFBEAgBCAGIAVBKGogCBACQQJ0aiIALwEAOwAAIAVBKGogAC0AAhABIAQgAC0AA2ohBAwBCwsDQCAEIAJNBEAgBCAGIAVBKGogCBACQQJ0aiIALwEAOwAAIAVBKGogAC0AAhABIAQgAC0AA2ohBAwBCwsCQCAEIA5PDQAgBCAGIAVBKGogCBACIgBBAnRqIgItAAA6AAAgAi0AA0EBRgRAIAVBKGogAi0AAhABDAELIAUoAixBH0sNACAFQShqIAYgAEECdGotAAIQASAFKAIsQSFJDQAgBUEgNgIsCwNAQQAgAyAQSSAFQRBqEAQbBEAgAyAGIAVBEGogCBACQQJ0aiIALwEAOwAAIAVBEGogAC0AAhABIAMgAC0AA2oiACAGIAVBEGogCBACQQJ0aiICLwEAOwAAIAVBEGogAi0AAhABIAAgAi0AA2ohAwwBBSAPQX5qIQIDQCAFQRBqEAQgAyACS3JFBEAgAyAGIAVBEGogCBACQQJ0aiIALwEAOwAAIAVBEGogAC0AAhABIAMgAC0AA2ohAwwBCwsDQCADIAJNBEAgAyAGIAVBEGogCBACQQJ0aiIALwEAOwAAIAVBEGogAC0AAhABIAMgAC0AA2ohAwwBCwsCQCADIA9PDQAgAyAGIAVBEGogCBACIgBBAnRqIgItAAA6AAAgAi0AA0EBRgRAIAVBEGogAi0AAhABDAELIAUoAhRBH0sNACAFQRBqIAYgAEECdGotAAIQASAFKAIUQSFJDQAgBUEgNgIUCyABQWwgBUHYAGoQCiAFQUBrEApxIAVBKGoQCnEgBUEQahAKcRshCwwJCwAACwALAAALAAsAAAsACwAACwALQWwhCwsgBUHwAGokACALC7UEAQ5/IwBBEGsiBiQAIAZBBGogABAOQVQhBQJAIARB3AtJDQAgBi0ABCEHIANB8ARqQQBB7AAQECEIIAdBDEsNACADQdwJaiIJIAggBkEIaiAGQQxqIAEgAhAxIhAQA0UEQCAGKAIMIgQgB0sNASADQdwFaiEPIANBpAVqIREgAEEEaiESIANBqAVqIQEgBCEFA0AgBSICQX9qIQUgCCACQQJ0aigCAEUNAAsgAkEBaiEOQQEhBQNAIAUgDk9FBEAgCCAFQQJ0IgtqKAIAIQwgASALaiAKNgIAIAVBAWohBSAKIAxqIQoMAQsLIAEgCjYCAEEAIQUgBigCCCELA0AgBSALRkUEQCABIAUgCWotAAAiDEECdGoiDSANKAIAIg1BAWo2AgAgDyANQQF0aiINIAw6AAEgDSAFOgAAIAVBAWohBQwBCwtBACEBIANBADYCqAUgBEF/cyAHaiEJQQEhBQNAIAUgDk9FBEAgCCAFQQJ0IgtqKAIAIQwgAyALaiABNgIAIAwgBSAJanQgAWohASAFQQFqIQUMAQsLIAcgBEEBaiIBIAJrIgRrQQFqIQgDQEEBIQUgBCAIT0UEQANAIAUgDk9FBEAgBUECdCIJIAMgBEE0bGpqIAMgCWooAgAgBHY2AgAgBUEBaiEFDAELCyAEQQFqIQQMAQsLIBIgByAPIAogESADIAIgARBkIAZBAToABSAGIAc6AAYgACAGKAIENgIACyAQIQULIAZBEGokACAFC8ENAQt/IwBB8ABrIgUkAEFsIQkCQCADQQpJDQAgAi8AACEKIAIvAAIhDCACLwAEIQYgBUEIaiAEEA4CQCADIAYgCiAMampBBmoiDUkNACAFLQAKIQcgBUHYAGogAkEGaiICIAoQBiIJEAMNASAFQUBrIAIgCmoiAiAMEAYiCRADDQEgBUEoaiACIAxqIgIgBhAGIgkQAw0BIAVBEGogAiAGaiADIA1rEAYiCRADDQEgACABaiIOQX1qIQ8gBEEEaiEGQQEhCSAAIAFBA2pBAnYiAmoiCiACaiIMIAJqIg0hAyAMIQQgCiECA0AgCSADIA9JcQRAIAYgBUHYAGogBxACQQF0aiIILQAAIQsgBUHYAGogCC0AARABIAAgCzoAACAGIAVBQGsgBxACQQF0aiIILQAAIQsgBUFAayAILQABEAEgAiALOgAAIAYgBUEoaiAHEAJBAXRqIggtAAAhCyAFQShqIAgtAAEQASAEIAs6AAAgBiAFQRBqIAcQAkEBdGoiCC0AACELIAVBEGogCC0AARABIAMgCzoAACAGIAVB2ABqIAcQAkEBdGoiCC0AACELIAVB2ABqIAgtAAEQASAAIAs6AAEgBiAFQUBrIAcQAkEBdGoiCC0AACELIAVBQGsgCC0AARABIAIgCzoAASAGIAVBKGogBxACQQF0aiIILQAAIQsgBUEoaiAILQABEAEgBCALOgABIAYgBUEQaiAHEAJBAXRqIggtAAAhCyAFQRBqIAgtAAEQASADIAs6AAEgA0ECaiEDIARBAmohBCACQQJqIQIgAEECaiEAIAkgBUHYAGoQDUVxIAVBQGsQDUVxIAVBKGoQDUVxIAVBEGoQDUVxIQkMAQsLIAQgDUsgAiAMS3INAEFsIQkgACAKSw0BIApBfWohCQNAIAVB2ABqEAQgACAJT3JFBEAgBiAFQdgAaiAHEAJBAXRqIggtAAAhCyAFQdgAaiAILQABEAEgACALOgAAIAYgBUHYAGogBxACQQF0aiIILQAAIQsgBUHYAGogCC0AARABIAAgCzoAASAAQQJqIQAMAQsLA0AgBUHYAGoQBCAAIApPckUEQCAGIAVB2ABqIAcQAkEBdGoiCS0AACEIIAVB2ABqIAktAAEQASAAIAg6AAAgAEEBaiEADAELCwNAIAAgCkkEQCAGIAVB2ABqIAcQAkEBdGoiCS0AACEIIAVB2ABqIAktAAEQASAAIAg6AAAgAEEBaiEADAELCyAMQX1qIQADQCAFQUBrEAQgAiAAT3JFBEAgBiAFQUBrIAcQAkEBdGoiCi0AACEJIAVBQGsgCi0AARABIAIgCToAACAGIAVBQGsgBxACQQF0aiIKLQAAIQkgBUFAayAKLQABEAEgAiAJOgABIAJBAmohAgwBCwsDQCAFQUBrEAQgAiAMT3JFBEAgBiAFQUBrIAcQAkEBdGoiAC0AACEKIAVBQGsgAC0AARABIAIgCjoAACACQQFqIQIMAQsLA0AgAiAMSQRAIAYgBUFAayAHEAJBAXRqIgAtAAAhCiAFQUBrIAAtAAEQASACIAo6AAAgAkEBaiECDAELCyANQX1qIQADQCAFQShqEAQgBCAAT3JFBEAgBiAFQShqIAcQAkEBdGoiAi0AACEKIAVBKGogAi0AARABIAQgCjoAACAGIAVBKGogBxACQQF0aiICLQAAIQogBUEoaiACLQABEAEgBCAKOgABIARBAmohBAwBCwsDQCAFQShqEAQgBCANT3JFBEAgBiAFQShqIAcQAkEBdGoiAC0AACECIAVBKGogAC0AARABIAQgAjoAACAEQQFqIQQMAQsLA0AgBCANSQRAIAYgBUEoaiAHEAJBAXRqIgAtAAAhAiAFQShqIAAtAAEQASAEIAI6AAAgBEEBaiEEDAELCwNAIAVBEGoQBCADIA9PckUEQCAGIAVBEGogBxACQQF0aiIALQAAIQIgBUEQaiAALQABEAEgAyACOgAAIAYgBUEQaiAHEAJBAXRqIgAtAAAhAiAFQRBqIAAtAAEQASADIAI6AAEgA0ECaiEDDAELCwNAIAVBEGoQBCADIA5PckUEQCAGIAVBEGogBxACQQF0aiIALQAAIQIgBUEQaiAALQABEAEgAyACOgAAIANBAWohAwwBCwsDQCADIA5JBEAgBiAFQRBqIAcQAkEBdGoiAC0AACECIAVBEGogAC0AARABIAMgAjoAACADQQFqIQMMAQsLIAFBbCAFQdgAahAKIAVBQGsQCnEgBUEoahAKcSAFQRBqEApxGyEJDAELQWwhCQsgBUHwAGokACAJC8oCAQR/IwBBIGsiBSQAIAUgBBAOIAUtAAIhByAFQQhqIAIgAxAGIgIQA0UEQCAEQQRqIQIgACABaiIDQX1qIQQDQCAFQQhqEAQgACAET3JFBEAgAiAFQQhqIAcQAkEBdGoiBi0AACEIIAVBCGogBi0AARABIAAgCDoAACACIAVBCGogBxACQQF0aiIGLQAAIQggBUEIaiAGLQABEAEgACAIOgABIABBAmohAAwBCwsDQCAFQQhqEAQgACADT3JFBEAgAiAFQQhqIAcQAkEBdGoiBC0AACEGIAVBCGogBC0AARABIAAgBjoAACAAQQFqIQAMAQsLA0AgACADT0UEQCACIAVBCGogBxACQQF0aiIELQAAIQYgBUEIaiAELQABEAEgACAGOgAAIABBAWohAAwBCwsgAUFsIAVBCGoQChshAgsgBUEgaiQAIAILtgMBCX8jAEEQayIGJAAgBkEANgIMIAZBADYCCEFUIQQCQAJAIANBQGsiDCADIAZBCGogBkEMaiABIAIQMSICEAMNACAGQQRqIAAQDiAGKAIMIgcgBi0ABEEBaksNASAAQQRqIQogBkEAOgAFIAYgBzoABiAAIAYoAgQ2AgAgB0EBaiEJQQEhBANAIAQgCUkEQCADIARBAnRqIgEoAgAhACABIAU2AgAgACAEQX9qdCAFaiEFIARBAWohBAwBCwsgB0EBaiEHQQAhBSAGKAIIIQkDQCAFIAlGDQEgAyAFIAxqLQAAIgRBAnRqIgBBASAEdEEBdSILIAAoAgAiAWoiADYCACAHIARrIQhBACEEAkAgC0EDTQRAA0AgBCALRg0CIAogASAEakEBdGoiACAIOgABIAAgBToAACAEQQFqIQQMAAALAAsDQCABIABPDQEgCiABQQF0aiIEIAg6AAEgBCAFOgAAIAQgCDoAAyAEIAU6AAIgBCAIOgAFIAQgBToABCAEIAg6AAcgBCAFOgAGIAFBBGohAQwAAAsACyAFQQFqIQUMAAALAAsgAiEECyAGQRBqJAAgBAutAQECfwJAQYQgKAIAIABHIAAoAgBBAXYiAyABa0F4aiICQXhxQQhHcgR/IAIFIAMQJ0UNASACQQhqC0EQSQ0AIAAgACgCACICQQFxIAAgAWpBD2pBeHEiASAAa0EBdHI2AgAgASAANgIEIAEgASgCAEEBcSAAIAJBAXZqIAFrIgJBAXRyNgIAQYQgIAEgAkH/////B3FqQQRqQYQgKAIAIABGGyABNgIAIAEQJQsLygIBBX8CQAJAAkAgAEEIIABBCEsbZ0EfcyAAaUEBR2oiAUEESSAAIAF2cg0AIAFBAnRB/B5qKAIAIgJFDQADQCACQXhqIgMoAgBBAXZBeGoiBSAATwRAIAIgBUEIIAVBCEsbZ0Efc0ECdEGAH2oiASgCAEYEQCABIAIoAgQ2AgALDAMLIARBHksNASAEQQFqIQQgAigCBCICDQALC0EAIQMgAUEgTw0BA0AgAUECdEGAH2ooAgAiAkUEQCABQR5LIQIgAUEBaiEBIAJFDQEMAwsLIAIgAkF4aiIDKAIAQQF2QXhqIgFBCCABQQhLG2dBH3NBAnRBgB9qIgEoAgBGBEAgASACKAIENgIACwsgAigCACIBBEAgASACKAIENgIECyACKAIEIgEEQCABIAIoAgA2AgALIAMgAygCAEEBcjYCACADIAAQNwsgAwvhCwINfwV+IwBB8ABrIgckACAHIAAoAvDhASIINgJcIAEgAmohDSAIIAAoAoDiAWohDwJAAkAgBUUEQCABIQQMAQsgACgCxOABIRAgACgCwOABIREgACgCvOABIQ4gAEEBNgKM4QFBACEIA0AgCEEDRwRAIAcgCEECdCICaiAAIAJqQazQAWooAgA2AkQgCEEBaiEIDAELC0FsIQwgB0EYaiADIAQQBhADDQEgB0EsaiAHQRhqIAAoAgAQEyAHQTRqIAdBGGogACgCCBATIAdBPGogB0EYaiAAKAIEEBMgDUFgaiESIAEhBEEAIQwDQCAHKAIwIAcoAixBA3RqKQIAIhRCEIinQf8BcSEIIAcoAkAgBygCPEEDdGopAgAiFUIQiKdB/wFxIQsgBygCOCAHKAI0QQN0aikCACIWQiCIpyEJIBVCIIghFyAUQiCIpyECAkAgFkIQiKdB/wFxIgNBAk8EQAJAIAZFIANBGUlyRQRAIAkgB0EYaiADQSAgBygCHGsiCiAKIANLGyIKEAUgAyAKayIDdGohCSAHQRhqEAQaIANFDQEgB0EYaiADEAUgCWohCQwBCyAHQRhqIAMQBSAJaiEJIAdBGGoQBBoLIAcpAkQhGCAHIAk2AkQgByAYNwNIDAELAkAgA0UEQCACBEAgBygCRCEJDAMLIAcoAkghCQwBCwJAAkAgB0EYakEBEAUgCSACRWpqIgNBA0YEQCAHKAJEQX9qIgMgA0VqIQkMAQsgA0ECdCAHaigCRCIJIAlFaiEJIANBAUYNAQsgByAHKAJINgJMCwsgByAHKAJENgJIIAcgCTYCRAsgF6chAyALBEAgB0EYaiALEAUgA2ohAwsgCCALakEUTwRAIAdBGGoQBBoLIAgEQCAHQRhqIAgQBSACaiECCyAHQRhqEAQaIAcgB0EYaiAUQhiIp0H/AXEQCCAUp0H//wNxajYCLCAHIAdBGGogFUIYiKdB/wFxEAggFadB//8DcWo2AjwgB0EYahAEGiAHIAdBGGogFkIYiKdB/wFxEAggFqdB//8DcWo2AjQgByACNgJgIAcoAlwhCiAHIAk2AmggByADNgJkAkACQAJAIAQgAiADaiILaiASSw0AIAIgCmoiEyAPSw0AIA0gBGsgC0Egak8NAQsgByAHKQNoNwMQIAcgBykDYDcDCCAEIA0gB0EIaiAHQdwAaiAPIA4gESAQEB4hCwwBCyACIARqIQggBCAKEAcgAkERTwRAIARBEGohAgNAIAIgCkEQaiIKEAcgAkEQaiICIAhJDQALCyAIIAlrIQIgByATNgJcIAkgCCAOa0sEQCAJIAggEWtLBEBBbCELDAILIBAgAiAOayICaiIKIANqIBBNBEAgCCAKIAMQDxoMAgsgCCAKQQAgAmsQDyEIIAcgAiADaiIDNgJkIAggAmshCCAOIQILIAlBEE8EQCADIAhqIQMDQCAIIAIQByACQRBqIQIgCEEQaiIIIANJDQALDAELAkAgCUEHTQRAIAggAi0AADoAACAIIAItAAE6AAEgCCACLQACOgACIAggAi0AAzoAAyAIQQRqIAIgCUECdCIDQcAeaigCAGoiAhAXIAIgA0HgHmooAgBrIQIgBygCZCEDDAELIAggAhAMCyADQQlJDQAgAyAIaiEDIAhBCGoiCCACQQhqIgJrQQ9MBEADQCAIIAIQDCACQQhqIQIgCEEIaiIIIANJDQAMAgALAAsDQCAIIAIQByACQRBqIQIgCEEQaiIIIANJDQALCyAHQRhqEAQaIAsgDCALEAMiAhshDCAEIAQgC2ogAhshBCAFQX9qIgUNAAsgDBADDQFBbCEMIAdBGGoQBEECSQ0BQQAhCANAIAhBA0cEQCAAIAhBAnQiAmpBrNABaiACIAdqKAJENgIAIAhBAWohCAwBCwsgBygCXCEIC0G6fyEMIA8gCGsiACANIARrSw0AIAQEfyAEIAggABALIABqBUEACyABayEMCyAHQfAAaiQAIAwLkRcCFn8FfiMAQdABayIHJAAgByAAKALw4QEiCDYCvAEgASACaiESIAggACgCgOIBaiETAkACQCAFRQRAIAEhAwwBCyAAKALE4AEhESAAKALA4AEhFSAAKAK84AEhDyAAQQE2AozhAUEAIQgDQCAIQQNHBEAgByAIQQJ0IgJqIAAgAmpBrNABaigCADYCVCAIQQFqIQgMAQsLIAcgETYCZCAHIA82AmAgByABIA9rNgJoQWwhECAHQShqIAMgBBAGEAMNASAFQQQgBUEESBshFyAHQTxqIAdBKGogACgCABATIAdBxABqIAdBKGogACgCCBATIAdBzABqIAdB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IAdB0AFqJAAgEAslACAAQgA3AgAgAEEAOwEIIABBADoACyAAIAE2AgwgACACOgAKC7QFAQN/IwBBMGsiBCQAIABB/wFqIgVBfWohBgJAIAMvAQIEQCAEQRhqIAEgAhAGIgIQAw0BIARBEGogBEEYaiADEBwgBEEIaiAEQRhqIAMQHCAAIQMDQAJAIARBGGoQBCADIAZPckUEQCADIARBEGogBEEYahASOgAAIAMgBEEIaiAEQRhqEBI6AAEgBEEYahAERQ0BIANBAmohAwsgBUF+aiEFAn8DQEG6fyECIAMiASAFSw0FIAEgBEEQaiAEQRhqEBI6AAAgAUEBaiEDIARBGGoQBEEDRgRAQQIhAiAEQQhqDAILIAMgBUsNBSABIARBCGogBEEYahASOgABIAFBAmohA0EDIQIgBEEYahAEQQNHDQALIARBEGoLIQUgAyAFIARBGGoQEjoAACABIAJqIABrIQIMAwsgAyAEQRBqIARBGGoQEjoAAiADIARBCGogBEEYahASOgADIANBBGohAwwAAAsACyAEQRhqIAEgAhAGIgIQAw0AIARBEGogBEEYaiADEBwgBEEIaiAEQRhqIAMQHCAAIQMDQAJAIARBGGoQBCADIAZPckUEQCADIARBEGogBEEYahAROgAAIAMgBEEIaiAEQRhqEBE6AAEgBEEYahAERQ0BIANBAmohAwsgBUF+aiEFAn8DQEG6fyECIAMiASAFSw0EIAEgBEEQaiAEQRhqEBE6AAAgAUEBaiEDIARBGGoQBEEDRgRAQQIhAiAEQQhqDAILIAMgBUsNBCABIARBCGogBEEYahAROgABIAFBAmohA0EDIQIgBEEYahAEQQNHDQALIARBEGoLIQUgAyAFIARBGGoQEToAACABIAJqIABrIQIMAgsgAyAEQRBqIARBGGoQEToAAiADIARBCGogBEEYahAROgADIANBBGohAwwAAAsACyAEQTBqJAAgAgtpAQF/An8CQAJAIAJBB00NACABKAAAQbfIwuF+Rw0AIAAgASgABDYCmOIBQWIgAEEQaiABIAIQPiIDEAMNAhogAEKBgICAEDcDiOEBIAAgASADaiACIANrECoMAQsgACABIAIQKgtBAAsLrQMBBn8jAEGAAWsiAyQAQWIhCAJAIAJBCUkNACAAQZjQAGogAUEIaiIEIAJBeGogAEGY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wOABCwutAgIEfwF+IwBBQGoiBCQAAkACQCACQQhJDQAgASgAAEFwcUHQ1LTCAUcNACABIAIQIiEBIABCADcDCCAAQQA2AgQgACABNgIADAELIARBGGogASACEC0iAxADBEAgACADEBoMAQsgAwRAIABBuH8QGgwBCyACIAQoAjAiA2shAiABIANqIQMDQAJAIAAgAyACIARBCGoQLCIFEAMEfyAFBSACIAVBA2oiBU8NAUG4fwsQGgwCCyAGQQFqIQYgAiAFayECIAMgBWohAyAEKAIMRQ0ACyAEKAI4BEAgAkEDTQRAIABBuH8QGgwCCyADQQRqIQMLIAQoAighAiAEKQMYIQcgAEEANgIEIAAgAyABazYCACAAIAIgBmytIAcgB0J/URs3AwgLIARBQGskAAslAQF/IwBBEGsiAiQAIAIgACABEFEgAigCACEAIAJBEGokACAAC30BBH8jAEGQBGsiBCQAIARB/wE2AggCQCAEQRBqIARBCGogBEEMaiABIAIQFSIGEAMEQCAGIQUMAQtBVCEFIAQoAgwiB0EGSw0AIAMgBEEQaiAEKAIIIAcQQSIFEAMNACAAIAEgBmogAiAGayADEDwhBQsgBEGQBGokACAFC4cBAgJ/An5BABAWIQMCQANAIAEgA08EQAJAIAAoAABBcHFB0NS0wgFGBEAgACABECIiAhADRQ0BQn4PCyAAIAEQVSIEQn1WDQMgBCAFfCIFIARUIQJCfiEEIAINAyAAIAEQUiICEAMNAwsgASACayEBIAAgAmohAAwBCwtCfiAFIAEbIQQLIAQLPwIBfwF+IwBBMGsiAiQAAn5CfiACQQhqIAAgARAtDQAaQgAgAigCHEEBRg0AGiACKQMICyEDIAJBMGokACADC40BAQJ/IwBBMGsiASQAAkAgAEUNACAAKAKI4gENACABIABB/OEBaigCADYCKCABIAApAvThATcDICAAEDAgACgCqOIBIQIgASABKAIoNgIYIAEgASkDIDcDECACIAFBEGoQGyAAQQA2AqjiASABIAEoAig2AgggASABKQMgNwMAIAAgARAbCyABQTBqJAALKgECfyMAQRBrIgAkACAAQQA2AgggAEIANwMAIAAQWCEBIABBEGokACABC4cBAQN/IwBBEGsiAiQAAkAgACgCAEUgACgCBEVzDQAgAiAAKAIINgIIIAIgACkCADcDAAJ/IAIoAgAiAQRAIAIoAghBqOMJIAERBQAMAQtBqOMJECgLIgFFDQAgASAAKQIANwL04QEgAUH84QFqIAAoAgg2AgAgARBZIAEhAwsgAkEQaiQAIAMLywEBAn8jAEEgayIBJAAgAEGBgIDAADYCtOIBIABBADYCiOIBIABBADYC7OEBIABCADcDkOIBIABBADYCpOMJIABBADYC3OIBIABCADcCzOIBIABBADYCvOIBIABBADYCxOABIABCADcCnOIBIABBpOIBakIANwIAIABBrOIBakEANgIAIAFCADcCECABQgA3AhggASABKQMYNwMIIAEgASkDEDcDACABKAIIQQh2QQFxIQIgAEEANgLg4gEgACACNgKM4gEgAUEgaiQAC3YBA38jAEEwayIBJAAgAARAIAEgAEHE0AFqIgIoAgA2AiggASAAKQK80AE3AyAgACgCACEDIAEgAigCADYCGCABIAApArzQATcDECADIAFBEGoQGyABIAEoAig2AgggASABKQMgNwMAIAAgARAbCyABQTBqJAALzAEBAX8gACABKAK00AE2ApjiASAAIAEoAgQiAjYCwOABIAAgAjYCvOABIAAgAiABKAIIaiICNgK44AEgACACNgLE4AEgASgCuNABBEAgAEKBgICAEDcDiOEBIAAgAUGk0ABqNgIMIAAgAUGUIGo2AgggACABQZwwajYCBCAAIAFBDGo2AgAgAEGs0AFqIAFBqNABaigCADYCACAAQbDQAWogAUGs0AFqKAIANgIAIABBtNABaiABQbDQAWooAgA2AgAPCyAAQgA3A4jhAQs7ACACRQRAQbp/DwsgBEUEQEFsDwsgAiAEEGAEQCAAIAEgAiADIAQgBRBhDwsgACABIAIgAyAEIAUQZQtGAQF/IwBBEGsiBSQAIAVBCGogBBAOAn8gBS0ACQRAIAAgASACIAMgBBAyDAELIAAgASACIAMgBBA0CyEAIAVBEGokACAACzQAIAAgAyAEIAUQNiIFEAMEQCAFDwsgBSAESQR/IAEgAiADIAVqIAQgBWsgABA1BUG4fwsLRgEBfyMAQRBrIgUkACAFQQhqIAQQDgJ/IAUtAAkEQCAAIAEgAiADIAQQYgwBCyAAIAEgAiADIAQQNQshACAFQRBqJAAgAAtZAQF/QQ8hAiABIABJBEAgAUEE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", ta = "display-p3", na = "display-p3-linear", ra = /* @__PURE__ */ new WeakMap(), ia = 0, aa, oa = class e extends ie {
	constructor(e) {
		super(e), this.transcoderPath = "", this.transcoderBinary = null, this.transcoderPending = null, this.workerPool = new Ui(), this.workerSourceURL = "", this.workerConfig = null, typeof MSC_TRANSCODER < "u" && console.warn("THREE.KTX2Loader: Please update to latest \"basis_transcoder\". \"msc_basis_transcoder\" is no longer supported in three.js r125+.");
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
			let t = new w(this.manager);
			t.setPath(this.transcoderPath), t.setWithCredentials(this.withCredentials);
			let n = t.loadAsync("basis_transcoder.js"), r = new w(this.manager);
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
			}), ia > 0 && console.warn("THREE.KTX2Loader: Multiple active KTX2 loaders may cause performance issues. Use a single KTX2Loader instance, or call .dispose() on old instances."), ia++;
		}
		return this.transcoderPending;
	}
	load(e, t, n, r) {
		if (this.workerConfig === null) throw Error("THREE.KTX2Loader: Missing initialization with `.detectSupport( renderer )`.");
		let i = new w(this.manager);
		i.setPath(this.path), i.setCrossOrigin(this.crossOrigin), i.setWithCredentials(this.withCredentials), i.setResponseType("arraybuffer"), i.load(e, (e) => {
			this.parse(e, t, r);
		}, n, r);
	}
	parse(e, t, n) {
		if (this.workerConfig === null) throw Error("THREE.KTX2Loader: Missing initialization with `.detectSupport( renderer )`.");
		if (ra.has(e)) return ra.get(e).promise.then(t).catch(n);
		this._createTexture(e).then((e) => t ? t(e) : null).catch(n);
	}
	_createTextureFrom(e, t) {
		let { type: n, error: r, data: { faces: i, width: a, height: o, format: s, type: c, dfdFlags: l } } = e;
		if (n === "error") return Promise.reject(r);
		let u;
		if (t.faceCount === 6) u = new x(i, s, c);
		else {
			let e = i[0].mipmaps;
			u = t.layerCount > 1 ? new b(e, a, o, t.layerCount, s, c) : new S(e, a, o, s, c);
		}
		return u.minFilter = i[0].mipmaps.length === 1 ? ne : E, u.magFilter = ne, u.generateMipmaps = !1, u.needsUpdate = !0, u.colorSpace = da(t), u.premultiplyAlpha = !!(l & 1), u;
	}
	async _createTexture(e, t = {}) {
		let n = Ji(new Uint8Array(e)), r = n.vkFormat === 1000066e3 && n.dataFormatDescriptor[0].colorModel === 167;
		if (!(n.vkFormat === 0 || r && !this.workerConfig.astcHDRSupported)) return ua(n);
		let i = t, a = this.init().then(() => this.workerPool.postMessage({
			type: "transcode",
			buffer: e,
			taskConfig: i
		}, [e])).then((e) => this._createTextureFrom(e.data, n));
		return ra.set(e, { promise: a }), a;
	}
	dispose() {
		this.workerPool.dispose(), this.workerSourceURL && URL.revokeObjectURL(this.workerSourceURL), ia--;
	}
};
oa.BasisFormat = {
	ETC1S: 0,
	UASTC: 1,
	UASTC_HDR: 2
}, oa.TranscoderFormat = {
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
}, oa.EngineFormat = {
	RGBAFormat: oe,
	RGBA_ASTC_4x4_Format: se,
	RGB_BPTC_UNSIGNED_Format: he,
	RGBA_BPTC_Format: le,
	RGBA_ETC2_EAC_Format: ue,
	RGBA_PVRTC_4BPPV1_Format: de,
	RGBA_S3TC_DXT5_Format: me,
	RGB_ETC1_Format: ge,
	RGB_ETC2_Format: _e,
	RGB_PVRTC_4BPPV1_Format: ve,
	RGBA_S3TC_DXT1_Format: fe
}, oa.EngineType = {
	UnsignedByteType: D,
	HalfFloatType: T,
	FloatType: te
}, oa.BasisWorker = function() {
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
var sa = /* @__PURE__ */ new Set([
	oe,
	be,
	xe
]), ca = {
	109: oe,
	97: oe,
	37: oe,
	43: oe,
	103: be,
	83: be,
	16: be,
	22: be,
	100: xe,
	76: xe,
	15: xe,
	9: xe,
	148: _e,
	152: ue,
	[Wi]: se,
	158: se,
	157: se,
	166: ce,
	165: ce,
	133: fe,
	134: fe,
	131: ye,
	132: ye,
	138: pe,
	137: pe,
	142: me,
	141: me,
	146: le,
	145: le
}, la = {
	109: te,
	97: T,
	37: D,
	43: D,
	103: te,
	83: T,
	16: D,
	22: D,
	100: te,
	76: T,
	15: D,
	9: D,
	148: D,
	152: D,
	[Wi]: T,
	166: D,
	165: D
};
async function ua(e) {
	let { vkFormat: t } = e;
	if (ca[t] === void 0) throw Error("THREE.KTX2Loader: Unsupported vkFormat.");
	let n;
	e.supercompressionScheme === 2 && (aa ||= new Promise(async (e) => {
		let t = new $i();
		await t.init(), e(t);
	}), n = await aa);
	let r = [];
	for (let i = 0; i < e.levels.length; i++) {
		let a = Math.max(1, e.pixelWidth >> i), o = Math.max(1, e.pixelHeight >> i), s = e.pixelDepth ? Math.max(1, e.pixelDepth >> i) : 0, c = e.levels[i], l;
		if (e.supercompressionScheme === 0) l = c.levelData;
		else if (e.supercompressionScheme === 2) l = n.decode(c.levelData, c.uncompressedByteLength);
		else throw Error("THREE.KTX2Loader: Unsupported supercompressionScheme.");
		let u;
		u = la[t] === te ? new Float32Array(l.buffer, l.byteOffset, l.byteLength / Float32Array.BYTES_PER_ELEMENT) : la[t] === T ? new Uint16Array(l.buffer, l.byteOffset, l.byteLength / Uint16Array.BYTES_PER_ELEMENT) : l, r.push({
			data: u,
			width: a,
			height: o,
			depth: s
		});
	}
	let i;
	if (sa.has(ca[t])) i = e.pixelDepth === 0 ? new C(r[0].data, e.pixelWidth, e.pixelHeight) : new ee(r[0].data, e.pixelWidth, e.pixelHeight, e.pixelDepth);
	else {
		if (e.pixelDepth > 0) throw Error("THREE.KTX2Loader: Unsupported pixelDepth.");
		i = new S(r, e.pixelWidth, e.pixelHeight), i.minFilter = r.length === 1 ? ne : E, i.magFilter = ne;
	}
	return i.mipmaps = r, i.type = la[t], i.format = ca[t], i.colorSpace = da(e), i.needsUpdate = !0, Promise.resolve(i);
}
function da(e) {
	let t = e.dataFormatDescriptor[0];
	return t.colorPrimaries === 1 ? t.transferFunction === 2 ? Se : re : t.colorPrimaries === 10 ? t.transferFunction === 2 ? ta : na : (t.colorPrimaries === 0 || console.warn(`THREE.KTX2Loader: Unsupported color primaries, "${t.colorPrimaries}"`), ae);
}
//#endregion
//#region src/engine/runtimeTextureLoader.ts
var fa = class {
	imageLoader = new y.TextureLoader();
	ktx2Loader;
	constructor(e, t = "/basis/") {
		this.ktx2Loader = new oa().setTranscoderPath(t).detectSupport(e), wt(Tt(e));
	}
	loadAsync(e) {
		return e.startsWith("original:") ? wt().loadAsync(e) : /\.ktx2(?:[?#]|$)/i.test(e) ? this.ktx2Loader.loadAsync(e) : this.imageLoader.loadAsync(e);
	}
	dispose() {
		this.ktx2Loader.dispose();
	}
}, pa = {
	maxOutputSize: 1024,
	enabled: !1
}, ma = 2048;
function ha(e, t, n) {
	let r = Math.max(1, Number.isFinite(e) ? e : 1), i = Math.max(1, Number.isFinite(t) ? t : 1);
	return Math.min(pa.maxOutputSize / i, ma / Math.max(r, i));
}
//#endregion
//#region src/original/unityAnimationClip.ts
function L(e, t) {
	if (!e) throw Error(t);
}
var R = Math.fround, ga = /* @__PURE__ */ function(e) {
	return e[e.Transform = 4] = "Transform", e[e.SkinnedMeshRenderer = 137] = "SkinnedMeshRenderer", e;
}({}), _a = /* @__PURE__ */ function(e) {
	return e[e.Position = 1] = "Position", e[e.Rotation = 2] = "Rotation", e[e.Scale = 3] = "Scale", e[e.EulerAngles = 4] = "EulerAngles", e;
}({});
function va(e, t) {
	return e === 4 ? t === 2 ? 4 : t === 1 || t === 3 || t === 4 ? 3 : 1 : 1;
}
function ya(e) {
	let t = e.m_Name, n = e.m_MuscleClip;
	L(!e.m_Legacy && !e.m_Compressed, `${t}: legacy / compressed clips are not built clips`), L(e.m_Events.length === 0, `${t}: animation events are not supported`), L(e.m_ClipBindingConstant.pptrCurveMapping.length === 0, `${t}: object reference curves are not supported`), L(!n.m_LoopBlend && !n.m_Mirror && n.m_CycleOffset === 0, `${t}: loop pose / mirror / cycle offset are not supported`);
	let r = n.m_Clip.data, i = r.m_StreamedClip, a = r.m_DenseClip, o = r.m_ConstantClip.data;
	L(i.discreteCurveCount === 0, `${t}: discrete streamed curves are not supported`), L(a.m_SampleArray.length === a.m_FrameCount * a.m_CurveCount, `${t}: truncated dense clip`);
	let s = [], c = 0;
	for (let n of e.m_ClipBindingConstant.genericBindings) {
		L(!n.isPPtrCurve && !n.isIntCurve && !n.isSerializeReferenceCurve, `${t}: object / integer curves are not supported`), L(n.typeID === 4 && n.customType === 0 && n.attribute >= 1 && n.attribute <= 3 || n.typeID === 4 && n.attribute === 4 && n.customType >= 0 && n.customType <= 5 || n.typeID === 137 && n.customType === 20, `${t}: unsupported binding type ${n.typeID} / custom ${n.customType} / attribute ${n.attribute}`);
		let e = va(n.typeID, n.attribute);
		s.push({
			path: n.path >>> 0,
			attribute: n.attribute >>> 0,
			typeID: n.typeID,
			customType: n.customType,
			offset: c,
			dimension: e
		}), c += e;
	}
	let l = i.curveCount + a.m_CurveCount + o.length;
	L(c === l, `${t}: bindings cover ${c} curves, the clip has ${l}`);
	let u = i.data, d = new DataView(u.buffer, u.byteOffset, u.byteLength), f = Array.from({ length: i.curveCount }, () => []), p = 0, m = -Infinity;
	for (; p < d.byteLength;) {
		let e = d.getFloat32(p, !0), n = d.getUint32(p + 4, !0);
		p += 8, L(e >= m, `${t}: streamed frames out of order`), m = e;
		for (let r = 0; r < n; r++, p += 20) {
			let n = d.getInt32(p, !0);
			L(n >= 0 && n < i.curveCount, `${t}: streamed key for curve ${n}`), f[n].push({
				time: e,
				at: p + 4
			});
		}
	}
	L(p === d.byteLength, `${t}: truncated streamed clip`);
	let h = new Uint32Array(i.curveCount + 1), g = 0;
	for (let e = 0; e < i.curveCount; e++) h[e] = g, L(f[e].length > 0, `${t}: streamed curve ${e} has no keys`), g += f[e].length;
	h[i.curveCount] = g;
	let _ = new Float32Array(g), v = new Float32Array(g * 4);
	for (let e = 0, t = 0; e < i.curveCount; e++) for (let n of f[e]) {
		_[t] = n.time;
		for (let e = 0; e < 4; e++) v[t * 4 + e] = d.getFloat32(n.at + e * 4, !0);
		t++;
	}
	return {
		name: t,
		startTime: n.m_StartTime,
		stopTime: n.m_StopTime,
		isLooping: n.m_LoopTime,
		bindings: s,
		curveCount: l,
		streamed: {
			curveCount: i.curveCount,
			keyStart: h,
			keyTimes: _,
			keyCoefficients: v
		},
		dense: {
			curveCount: a.m_CurveCount,
			frameCount: a.m_FrameCount,
			sampleRate: a.m_SampleRate,
			beginTime: a.m_BeginTime,
			samples: Float32Array.from(a.m_SampleArray)
		},
		constants: Float32Array.from(o)
	};
}
function ba(e) {
	return R(e.stopTime - e.startTime);
}
function xa(e, t, n) {
	let r = R(t), { streamed: i, dense: a, constants: o } = e, { keyStart: s, keyTimes: c, keyCoefficients: l } = i;
	for (let e = 0; e < i.curveCount; e++) {
		let t = s[e], i = s[e + 1] - 1;
		for (; t < i;) {
			let e = t + i + 1 >> 1;
			c[e] <= r ? t = e : i = e - 1;
		}
		let a = t * 4, o = R(r - c[t]);
		n[e] = R(R(R(R(R(R(l[a] * o) + l[a + 1]) * o) + l[a + 2]) * o) + l[a + 3]);
	}
	let u = i.curveCount;
	if (a.curveCount > 0) {
		let e = R(R(r - a.beginTime) * a.sampleRate), t = Math.floor(e), i = R(e - t), o = a.frameCount - 1, s = Math.min(Math.max(t, 0), o) * a.curveCount, c = Math.min(Math.max(t + 1, 0), o) * a.curveCount;
		for (let e = 0; e < a.curveCount; e++) {
			let t = a.samples[s + e];
			n[u + e] = R(t + R(R(a.samples[c + e] - t) * i));
		}
	}
	return n.set(o, u + a.curveCount), n;
}
//#endregion
//#region src/original/partSpring.ts
function Sa(e) {
	if (typeof e == "bigint") return Number(e);
	if (e instanceof Uint8Array || ArrayBuffer.isView(e)) return Array.from(e);
	if (Array.isArray(e)) return e.map(Sa);
	if (e && typeof e == "object") {
		let t = {};
		for (let [n, r] of Object.entries(e)) t[n] = Sa(r);
		return t;
	}
	return e;
}
function z(e, t) {
	if (!e || typeof e != "object" || Array.isArray(e)) return;
	let n = e;
	if (t in n) return n[t];
	let r = t.toLowerCase();
	for (let e of Object.keys(n)) if (e.toLowerCase() === r) return n[e];
}
function B(e) {
	return !!e && typeof e == "object" && !Array.isArray(e);
}
var V = (e, t) => {
	let n = z(e, t);
	return typeof n == "number" ? Math.fround(n) : null;
}, H = (e, t) => {
	let n = z(e, t);
	return typeof n == "number" && n >= -2147483648 && n <= 2147483647 ? Math.trunc(n) : null;
}, Ca = (e, t) => {
	let n = z(e, t);
	return typeof n == "number" && Number.isInteger(n) ? n : null;
}, U = (e, t) => {
	let n = z(e, t);
	return typeof n == "boolean" ? n : typeof n == "number" ? Number.isInteger(n) ? n !== 0 : Math.abs(n) > 1e-5 : null;
}, wa = (e, t) => {
	let n = z(e, t);
	return typeof n == "string" && n.trim() ? n : null;
}, W = (e, t) => {
	let n = z(e, t);
	return B(n) ? Ta(n) : null;
};
function Ta(e) {
	let t = V(e, "x") ?? V(e, "X"), n = V(e, "y") ?? V(e, "Y"), r = V(e, "z") ?? V(e, "Z");
	return t !== null && n !== null && r !== null ? {
		x: t,
		y: n,
		z: r
	} : null;
}
var G = (e, t) => {
	let n = z(e, t);
	return Array.isArray(n) ? n : null;
};
function Ea(e) {
	if (e == null) return null;
	if (typeof e == "boolean") return e;
	if (typeof e == "number" || typeof e == "bigint") return Number(e) === 1 || Number(e) !== 0 && null;
	let t = String(e).trim().toLowerCase();
	return t === "true" || t !== "false" && null;
}
var Da = (e, t, n) => Ea(e[t]) ?? n, K = (e, t, n) => {
	let r = e[t];
	return typeof r == "number" ? Math.fround(r) : n;
}, Oa = (e, t) => {
	let n = e[t];
	return typeof n == "number" ? Math.fround(n) : null;
}, ka = (e, t) => {
	let n = e[t];
	return B(n) ? {
		x: K(n, "x", K(n, "X", 0)),
		y: K(n, "y", K(n, "Y", 0)),
		z: K(n, "z", K(n, "Z", 0))
	} : null;
};
function Aa(e, t) {
	return e === t ? 0 : e == null ? -1 : t == null ? 1 : e < t ? -1 : 1;
}
function q(e, ...t) {
	return [...e].sort((e, n) => {
		for (let r of t) {
			let t = r(e), i = r(n), a = typeof t == "string" || typeof i == "string" || t === null || i === null || t === void 0 || i === void 0 ? Aa(t, i) : t < i ? -1 : +(t > i);
			if (a) return a;
		}
		return 0;
	});
}
var J = (e) => {
	if (!e || !e.trim()) return null;
	let t = e.indexOf("/");
	return t < 0 ? e : e.slice(0, t);
};
function Y(e) {
	for (let t of Object.keys(e)) (e[t] === null || e[t] === void 0) && delete e[t];
	return e;
}
var ja = {
	1818360609: "RotationConstraint",
	1773428102: "ParentConstraint",
	895512359: "AimConstraint",
	1818360608: "PositionConstraint"
}, Ma = [
	"RotationConstraint",
	"ParentConstraint",
	"AimConstraint",
	"PositionConstraint"
], Na = {
	[k.MeshRenderer]: "MeshRenderer",
	[k.SkinnedMeshRenderer]: "SkinnedMeshRenderer"
}, Pa = new Set([
	"SpringManager",
	"SpringBone",
	"SpringSphereCollider",
	"SpringCapsuleCollider",
	"SpringPanelCollider",
	"SpringBonePivot",
	"ExtraBone",
	"ForceVolume",
	"WindVolume",
	"WindVolumeOneSelf",
	"SekaiCharacterHair",
	"SekaiCharacterEye",
	"CharacterAccessoryTransformController",
	"CharacterAccessoryTransformData"
].map((e) => e.toLowerCase())), Fa = class {
	bundle;
	objects;
	refs = /* @__PURE__ */ new Map();
	activeSelf = /* @__PURE__ */ new Map();
	constructor(e, t) {
		this.bundle = e, this.objects = t;
		for (let n of t) {
			if (n.classId !== k.GameObject) continue;
			let t = n.read(), r = e.gameObjectTransform(t), i = r === null ? null : e.transformPath(r), a = this.goActiveSelf(n.pathId), o = this.goActiveInHierarchy(n.pathId, /* @__PURE__ */ new Set());
			this.refs.set(Number(n.pathId), {
				fileId: 0,
				pathId: Number(n.pathId),
				name: t.m_Name,
				transformPath: i,
				activeSelf: a,
				activeInHierarchy: o
			}), r !== null && this.refs.set(Number(r), {
				fileId: 0,
				pathId: Number(r),
				name: t.m_Name,
				transformPath: i,
				activeSelf: a,
				activeInHierarchy: o
			});
		}
		for (let n of t) if (n.classId === k.MonoBehaviour) {
			let t = n.read(), r = this.gameObjectRef(t.m_GameObject);
			this.refs.set(Number(n.pathId), {
				fileId: 0,
				pathId: Number(n.pathId),
				name: r?.name ?? e.script(t).name,
				transformPath: r?.transformPath,
				activeSelf: r?.activeSelf,
				activeInHierarchy: r?.activeInHierarchy
			});
		} else if (Na[n.classId]) {
			let e = n.read(), t = this.gameObjectRef(e.m_GameObject);
			this.refs.set(Number(n.pathId), {
				fileId: 0,
				pathId: Number(n.pathId),
				name: t?.name ?? Na[n.classId],
				transformPath: t?.transformPath,
				activeSelf: t?.activeSelf,
				activeInHierarchy: t?.activeInHierarchy
			});
		}
	}
	goActiveSelf(e) {
		if (!this.activeSelf.has(e)) {
			let t = this.bundle.object(e)?.read();
			this.activeSelf.set(e, t ? !!t.m_IsActive : null);
		}
		return this.activeSelf.get(e);
	}
	goActiveInHierarchy(e, t) {
		if (t.has(e)) return null;
		t.add(e);
		let n = this.goActiveSelf(e);
		if (n === !1) return !1;
		let r = this.bundle.object(e)?.read(), i = r ? this.bundle.gameObjectTransform(r) : null, a = i === null ? null : this.bundle.object(i)?.read(), o = a ? this.bundle.read(a.m_Father) : null, s = o ? this.bundle.local(o.m_GameObject) : null;
		if (!s) return n;
		let c = this.goActiveInHierarchy(s.pathId, t);
		return c === !1 ? !1 : n === null || c === null ? null : !0;
	}
	gameObjectRef(e) {
		if (!e || e.m_PathID === 0n) return null;
		let t = this.bundle.local(e);
		if (!t) return {
			fileId: e.m_FileID,
			pathId: Number(e.m_PathID),
			name: null,
			transformPath: null
		};
		let n = t.read(), r = this.bundle.gameObjectTransform(n);
		return {
			fileId: e.m_FileID,
			pathId: Number(e.m_PathID),
			name: n.m_Name,
			transformPath: r === null ? null : this.bundle.transformPath(r),
			transformPathId: r === null ? null : Number(r),
			activeSelf: this.goActiveSelf(t.pathId),
			activeInHierarchy: this.goActiveInHierarchy(t.pathId, /* @__PURE__ */ new Set())
		};
	}
	objectRef(e) {
		if (!B(e)) return null;
		let t = H(e, "m_FileID") ?? 0, n = Ca(e, "m_PathID") ?? 0;
		if (n === 0) return null;
		let r = this.refs.get(n);
		return r ? {
			...r,
			fileId: t,
			pathId: n
		} : {
			fileId: t,
			pathId: n,
			name: null,
			transformPath: null
		};
	}
}, Ia = (e) => e ? Y({ ...e }) : null;
function La(e) {
	let t = [], n = (e, t) => {
		if (Array.isArray(e)) for (let r of e) n(r, t);
		else if (B(e)) {
			let r = H(e, "m_FileID"), i = Ca(e, "m_PathID");
			if (r !== null && i !== null) {
				t.push({
					fileId: r,
					pathId: i
				});
				return;
			}
			for (let r of Object.values(e)) n(r, t);
		}
	};
	for (let [r, i] of Object.entries(e)) {
		let e = [];
		if (n(i, e), !e.length) continue;
		let a = /* @__PURE__ */ new Set();
		t.push({
			fieldPath: r,
			references: e.filter((e) => {
				let t = `${e.fileId}:${e.pathId}`;
				return e.pathId === 0 || a.has(t) ? !1 : (a.add(t), !0);
			})
		});
	}
	return t;
}
function Ra(e, t, n, r) {
	let i = new Fa(e, t), a = t.filter((e) => Na[e.classId]), o = new Map(a.map((e) => [Number(e.pathId), Sa(e.read())])), s = new Map(a.map((e) => [Number(e.pathId), U(o.get(Number(e.pathId)), "m_Enabled")])), c = t.filter((e) => e.classId === k.MonoBehaviour).map((t) => {
		let n = t.read(), r = e.script(n);
		return {
			object: t,
			pathId: Number(t.pathId),
			scriptName: r.name,
			scriptNamespace: r.namespace,
			raw: Sa(n)
		};
	}), l = (e, t) => e.scriptName.toLowerCase() === t.toLowerCase(), u = /* @__PURE__ */ new Set();
	for (let e of c.filter((e) => l(e, "SpringManager"))) for (let t of G(e.raw, "springBones") ?? []) {
		let e = i.objectRef(t);
		e && u.add(e.pathId);
	}
	let d = c.filter((e) => Pa.has(e.scriptName.toLowerCase())), f = new Map(c.map((e) => [e.pathId, e])), p = [];
	for (let e of d) Object.keys(e.raw).length || p.push(`MonoBehaviour ${e.scriptName}:${e.pathId} has no readable typetree payload.`);
	let m = (e) => i.gameObjectRef(e.object.read().m_GameObject), h = (e) => ({
		pathId: e.pathId,
		scriptName: e.scriptName,
		gameObject: m(e),
		raw: e.raw
	}), g = d.filter((e) => l(e, "SpringManager")).map(h), _ = [...u].map((e) => f.get(e)).filter((e) => !!e).map((e) => ({
		pathId: e.pathId,
		scriptName: e.scriptName,
		gameObject: m(e),
		pivotNode: i.objectRef(z(e.raw, "pivotNode")),
		radius: V(e.raw, "radius"),
		stiffnessForce: V(e.raw, "stiffnessForce"),
		dragForce: V(e.raw, "dragForce"),
		windInfluence: V(e.raw, "windInfluence"),
		springForce: W(e.raw, "springForce"),
		lengthLimitTargets: (G(e.raw, "lengthLimitTargets") ?? []).map((e) => i.objectRef(e)).filter((e) => !!e),
		colliders: [
			"colliders",
			"sphereColliders",
			"capsuleColliders",
			"panelColliders"
		].flatMap((t) => G(e.raw, t) ?? []).map((e) => i.objectRef(e)).filter((e) => !!e),
		raw: e.raw
	}));
	for (let e of u) f.has(e) || p.push(`SpringManager referenced missing spring bone MonoBehaviour PathID ${e}.`);
	let v = (e) => {
		let t = z(e.raw, "linkedRenderer"), n = B(t) ? Ca(t, "m_PathID") : null, r = n !== null && s.has(n) ? s.get(n) : null;
		return {
			pathId: e.pathId,
			scriptName: e.scriptName,
			gameObject: m(e),
			linkedRenderer: i.objectRef(t),
			linkedRendererEnabled: r,
			radius: V(e.raw, "radius"),
			height: V(e.raw, "height") ?? V(e.raw, "length"),
			center: W(e.raw, "center") ?? W(e.raw, "offset"),
			direction: W(e.raw, "direction"),
			raw: e.raw
		};
	}, y = d.filter((e) => l(e, "SpringSphereCollider")).map(v), b = d.filter((e) => l(e, "SpringCapsuleCollider")).map(v), x = d.filter((e) => l(e, "SpringPanelCollider")).map(v), S = c.filter((e) => l(e, "ForceVolume") || l(e, "WindVolume") || l(e, "WindVolumeOneSelf")).map(h), ee = d.filter((e) => l(e, "SpringBonePivot")).map(h), C = d.filter((e) => l(e, "ExtraBone")).map((e) => ({
		pathId: e.pathId,
		scriptName: e.scriptName,
		gameObject: m(e),
		referenceBone: i.objectRef(z(e.raw, "referenceBone")),
		rotationOrder: H(e.raw, "rotationOrder"),
		coefficient: V(e.raw, "coefficient"),
		defaultEulerAngles: W(e.raw, "defaultEulerAngles"),
		axisX: H(e.raw, "axisX"),
		axisY: H(e.raw, "axisY"),
		axisZ: H(e.raw, "axisZ"),
		raw: e.raw
	})), w = Ua(c), te = Ha(c), T = d.find((e) => l(e, "SekaiCharacterHair")), ne = T ? {
		pathId: T.pathId,
		scriptName: T.scriptName,
		gameObject: m(T),
		headTransform: i.objectRef(z(T.raw, "headTransform")),
		offset: W(T.raw, "offset"),
		raw: T.raw
	} : null, E = d.find((e) => l(e, "SekaiCharacterEye")), re = (e, t) => {
		let n = z(e, t);
		if (!B(n)) return null;
		let r = H(n, "TileX"), i = H(n, "TileY"), a = H(n, "Sample");
		return r !== null && i !== null && a !== null ? {
			tileX: r,
			tileY: i,
			sample: a
		} : null;
	}, ie = (e, t) => {
		let n = z(e, t);
		if (!B(n)) return null;
		let r = V(n, "r") ?? V(n, "R"), i = V(n, "g") ?? V(n, "G"), a = V(n, "b") ?? V(n, "B"), o = V(n, "a") ?? V(n, "A");
		return r !== null && i !== null && a !== null && o !== null ? {
			r,
			g: i,
			b: a,
			a: o
		} : null;
	}, ae = E ? {
		pathId: E.pathId,
		scriptName: E.scriptName,
		gameObject: m(E),
		lightInfluence: V(E.raw, "lightInfluence"),
		lightInfluenceForEyeHighlight: V(E.raw, "lightInfluenceForEyeHighlight"),
		tintColor: ie(E.raw, "tintColor"),
		emissionColor: ie(E.raw, "emissionColor"),
		baseTiling: re(E.raw, "baseTiling"),
		highlightTiling: re(E.raw, "highlightTiling"),
		leftEyeCloseBlendShapeValue: V(E.raw, "leftEyeCloseBlendShapeValue"),
		rightEyeCloseBlendShapeValue: V(E.raw, "rightEyeCloseBlendShapeValue"),
		raw: E.raw
	} : null;
	return d.length || p.push("No SpringManager/SpringBone/Spring*Collider MonoBehaviours found."), !g.length && _.length && p.push("SpringBone entries were found, but SpringManager was not found."), {
		version: 1,
		bundlePath: r,
		partKind: n,
		prefabGraph: za(i, n, r, c, o),
		managers: g,
		bones: _,
		sphereColliders: y,
		capsuleColliders: b,
		panelColliders: x,
		forceProviders: S,
		springBonePivots: ee,
		extraBones: C,
		accessoryTransformAdjustments: w,
		funit: te,
		characterHair: ne,
		characterEye: ae,
		warnings: p
	};
}
function za(e, t, n, r, i) {
	let { bundle: a, objects: o } = e, s = q(o.filter((e) => e.classId === k.GameObject).map((e) => {
		let t = e.read(), n = a.gameObjectTransform(t);
		return {
			o: e,
			go: t,
			t: n,
			path: n === null ? t.m_Name : a.transformPath(n)
		};
	}), (e) => e.path, (e) => e.o.pathId).map((t) => Y({
		pathId: Number(t.o.pathId),
		name: t.go.m_Name,
		activeSelf: e.goActiveSelf(t.o.pathId),
		activeInHierarchy: e.goActiveInHierarchy(t.o.pathId, /* @__PURE__ */ new Set()),
		transformPathId: t.t === null ? null : Number(t.t),
		transformPath: t.t === null ? null : a.transformPath(t.t),
		componentPathIds: t.go.m_Component.map((e) => Number(e.component.m_PathID)).filter((e) => e !== 0)
	})), c = q(o.filter((e) => e.classId === k.Transform).map((e) => ({
		o: e,
		t: e.read(),
		path: a.transformPath(e.pathId)
	})), (e) => e.path, (e) => e.o.pathId).map((e) => {
		let t = a.read(e.t.m_GameObject);
		return Y({
			pathId: Number(e.o.pathId),
			gameObjectPathId: e.t.m_GameObject.m_PathID === 0n ? null : Number(e.t.m_GameObject.m_PathID),
			name: t?.m_Name ?? null,
			transformPath: e.path,
			poseRoot: J(e.path),
			parentPathId: e.t.m_Father.m_PathID === 0n ? null : Number(e.t.m_Father.m_PathID),
			childPathIds: e.t.m_Children.map((e) => Number(e.m_PathID)).filter((e) => e !== 0),
			localPosition: { ...e.t.m_LocalPosition },
			localRotation: { ...e.t.m_LocalRotation },
			localScale: { ...e.t.m_LocalScale }
		});
	}), l = q(o.filter((e) => Na[e.classId]).map((t) => {
		let n = t.read();
		return {
			o: t,
			r: n,
			go: e.gameObjectRef(n.m_GameObject)
		};
	}), (e) => e.go?.transformPath, (e) => e.o.pathId).map((t) => {
		let n = t.o.classId === k.SkinnedMeshRenderer, r = null;
		if (n) r = t.r.m_Mesh ?? null;
		else {
			let n = e.bundle.read(t.r.m_GameObject)?.m_Component.map((t) => e.bundle.local(t.component)).find((e) => e?.classId === k.MeshFilter);
			r = n ? n.read().m_Mesh : null;
		}
		let a = r ? e.bundle.read(r) : null, o = i.get(Number(t.o.pathId));
		return Y({
			pathId: Number(t.o.pathId),
			typeName: Na[t.o.classId],
			gameObjectPathId: t.r.m_GameObject.m_PathID === 0n ? null : Number(t.r.m_GameObject.m_PathID),
			transformPathId: t.go?.transformPathId ?? null,
			name: t.go?.name ?? null,
			transformPath: t.go?.transformPath ?? null,
			poseRoot: J(t.go?.transformPath),
			activeSelf: t.go?.activeSelf ?? null,
			activeInHierarchy: t.go?.activeInHierarchy ?? null,
			enabled: U(o, "m_Enabled") ?? !1,
			meshPathId: r && r.m_PathID !== 0n ? Number(r.m_PathID) : null,
			meshName: a?.m_Name ?? null,
			skinnedMeshBones: n ? (t.r.m_Bones ?? []).map((e) => Number(e.m_PathID)).filter((e) => e !== 0) : [],
			rootBonePathId: o ? e.objectRef(z(o, "m_RootBone"))?.pathId ?? null : null,
			materialFileIds: t.r.m_Materials.map((e) => e.m_FileID),
			materialPathIds: t.r.m_Materials.map((e) => Number(e.m_PathID))
		});
	}), u = q(o.filter((e) => e.classId === k.Animator).map((t) => {
		let n = t.read();
		return {
			o: t,
			a: n,
			go: e.gameObjectRef(n.m_GameObject)
		};
	}), (e) => e.go?.transformPath, (e) => e.o.pathId).map((e) => Y({
		pathId: Number(e.o.pathId),
		gameObjectPathId: e.a.m_GameObject.m_PathID === 0n ? null : Number(e.a.m_GameObject.m_PathID),
		name: e.go?.name ?? null,
		transformPath: e.go?.transformPath ?? null,
		poseRoot: J(e.go?.transformPath),
		enabled: Number(e.a.m_Enabled) !== 0,
		hasTransformHierarchy: !!e.a.m_HasTransformHierarchy,
		avatarPathId: e.a.m_Avatar.m_PathID === 0n ? null : Number(e.a.m_Avatar.m_PathID),
		controllerPathId: e.a.m_Controller.m_PathID === 0n ? null : Number(e.a.m_Controller.m_PathID)
	})), d = q(r.map((t) => ({
		m: t,
		go: e.gameObjectRef(t.object.read().m_GameObject)
	})), (e) => e.go?.transformPath, (e) => e.m.scriptName, (e) => e.m.object.pathId).map((e) => {
		let t = e.m.object.read().m_GameObject;
		return Y({
			pathId: e.m.pathId,
			scriptName: e.m.scriptName,
			gameObjectPathId: t.m_PathID === 0n ? null : Number(t.m_PathID),
			name: e.go?.name ?? null,
			transformPath: e.go?.transformPath ?? null,
			poseRoot: J(e.go?.transformPath),
			enabled: U(e.m.raw, "m_Enabled"),
			objectReferenceFields: La(e.m.raw)
		});
	}), f = q(o.filter((e) => ja[e.classId]).map((t) => {
		let n = Sa(t.read());
		return {
			o: t,
			raw: n,
			owner: e.objectRef(z(n, "m_GameObject")),
			typeName: ja[t.classId]
		};
	}), (e) => e.owner?.transformPath, (e) => e.typeName, (e) => e.o.pathId).map((t) => Va(e, t.o, t.raw, t.owner, t.typeName)), p = c.filter((e) => e.parentPathId === void 0).map((e) => e.pathId);
	return {
		version: 1,
		partKind: t,
		bundlePath: n,
		gameObjects: s,
		transforms: c,
		renderers: l,
		animators: u,
		monoBehaviours: d,
		constraints: f,
		constraintCapability: {
			requestedTypes: Ma,
			supportedTypes: Ma,
			missingTypes: []
		},
		rootTransformPathIds: p
	};
}
function Ba(e, t) {
	let n = U(e, `${t}X`), r = U(e, `${t}Y`), i = U(e, `${t}Z`);
	return n === null && r === null && i === null ? null : !!n | (r ? 2 : 0) | (i ? 4 : 0);
}
function Va(e, t, n, r, i) {
	let a = e.objectRef(z(n, "m_WorldUpObject") ?? z(n, "worldUpObject") ?? z(n, "WorldUpObject")), o = (e) => {
		if (Array.isArray(e)) return e;
		if (!B(e)) return null;
		for (let t of [
			"data",
			"Array",
			"items"
		]) if (z(e, t) !== void 0) return o(z(e, t));
		return null;
	}, s = (...e) => {
		for (let t of e) {
			let e = z(n, t);
			if (e === void 0) continue;
			let r = o(e);
			if (r) return r;
		}
		return null;
	}, c = s("m_Sources", "sources", "Sources") ?? [], l = s("m_TranslationOffsets", "translationOffsets", "TranslationOffsets"), u = s("m_RotationOffsets", "rotationOffsets", "RotationOffsets"), d = (e, t) => e && B(e[t]) ? Ta(e[t]) : null, f = c.flatMap((t, n) => {
		if (!B(t)) return [];
		let r = e.objectRef(z(t, "sourceTransform") ?? z(t, "m_SourceTransform") ?? z(t, "transform") ?? z(t, "Transform"));
		return [Y({
			sourcePathId: r?.pathId ?? null,
			sourceName: r?.name ?? null,
			sourcePath: r?.transformPath ?? null,
			weight: V(t, "weight") ?? V(t, "m_Weight") ?? 1,
			translationOffset: W(t, "translationOffset") ?? W(t, "m_TranslationOffset") ?? W(t, "offset") ?? W(t, "m_Offset") ?? d(l, n),
			rotationOffset: W(t, "rotationOffset") ?? W(t, "m_RotationOffset") ?? d(u, n)
		})];
	}), p = i === "RotationConstraint" ? "rotation" : i === "ParentConstraint" ? "parent" : i === "PositionConstraint" ? "position" : "aim";
	return Y({
		pathId: Number(t.pathId),
		type: p,
		typeName: i,
		gameObjectPathId: r?.pathId ?? null,
		ownerName: r?.name ?? null,
		ownerPath: r?.transformPath ?? null,
		poseRoot: J(r?.transformPath),
		enabled: U(n, "m_Enabled"),
		active: U(n, "m_ConstraintActive") ?? U(n, "constraintActive") ?? U(n, "m_Active"),
		weight: V(n, "m_Weight") ?? V(n, "weight") ?? 1,
		locked: U(n, "m_Locked") ?? U(n, "locked"),
		translationAxis: Ba(n, "m_AffectTranslation") ?? H(n, "m_TranslationAxes") ?? H(n, "m_TranslationAxis") ?? H(n, "translationAxis"),
		rotationAxis: Ba(n, "m_AffectRotation") ?? H(n, "m_RotationAxes") ?? H(n, "m_RotationAxis") ?? H(n, "m_Axes") ?? H(n, "rotationAxis"),
		translationAtRest: W(n, "m_TranslationAtRest") ?? W(n, "translationAtRest"),
		rotationAtRest: W(n, "m_RotationAtRest") ?? W(n, "rotationAtRest"),
		translationOffset: W(n, "m_TranslationOffset") ?? W(n, "translationOffset"),
		rotationOffset: W(n, "m_RotationOffset") ?? W(n, "rotationOffset"),
		aimVector: W(n, "m_AimVector") ?? W(n, "aimVector"),
		upVector: W(n, "m_UpVector") ?? W(n, "upVector"),
		worldUpVector: W(n, "m_WorldUpVector") ?? W(n, "worldUpVector"),
		worldUpType: H(n, "m_UpType") ?? H(n, "m_WorldUpType") ?? H(n, "worldUpType"),
		worldUpObjectPathId: a?.pathId ?? null,
		worldUpObjectName: a?.name ?? null,
		worldUpObjectPath: a?.transformPath ?? null,
		sources: f,
		objectReferenceFields: La(n)
	});
}
function Ha(e) {
	let t = e.filter((e) => e.scriptNamespace === "FUnit" || e.scriptNamespace.startsWith("FUnit.")), n = [...new Set(t.map((e) => e.scriptNamespace.trim() ? `${e.scriptNamespace}.${e.scriptName}` : e.scriptName))].sort(Aa), r = (e) => t.filter((t) => t.scriptName.toLowerCase() === e.toLowerCase()).length;
	return {
		present: t.length > 0,
		scriptCount: t.length,
		springManagerCount: r("SpringManager"),
		springBoneCount: r("SpringBone"),
		sphereColliderCount: r("SpringSphereCollider"),
		capsuleColliderCount: r("SpringCapsuleCollider"),
		panelColliderCount: r("SpringPanelCollider"),
		detectedScripts: n,
		policy: "metadata_only; do not merge with UTJ/Sekai SpringBone runtime"
	};
}
function Ua(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e.filter((e) => e.scriptName.toLowerCase() === "characteraccessorytransformcontroller")) {
		let e = z(n.raw, "_characterAccessoryTransformData") ?? z(n.raw, "characterAccessoryTransformData"), r = B(e) ? Ca(e, "m_PathID") : null;
		r !== null && t.add(r);
	}
	let n = e.filter((e) => e.scriptName.toLowerCase() === "characteraccessorytransformdata" && (!t.size || t.has(e.pathId))), r = /* @__PURE__ */ new Map();
	for (let e of n) {
		let t = z(e.raw, "_faceIdAccessoryTransformDict") ?? z(e.raw, "faceIdAccessoryTransformDict") ?? z(e.raw, "FaceIdAccessoryTransformDict") ?? e.raw, n = [];
		qa(t, null, n);
		for (let e of n) r.has(e.faceId) || r.set(e.faceId, e);
	}
	return [...r.values()].sort((e, t) => Aa(e.faceId, t.faceId));
}
function Wa(e, t) {
	return B(z(e, t));
}
function Ga(e, t) {
	return !t || !t.trim() || !B(e) || ![
		"pos",
		"position",
		"rot",
		"rotation",
		"rotationEulerDegrees",
		"scale"
	].some((t) => Wa(e, t)) ? null : {
		faceId: t,
		position: W(e, "pos") ?? W(e, "position") ?? {
			x: 0,
			y: 0,
			z: 0
		},
		rotationEulerDegrees: W(e, "rot") ?? W(e, "rotation") ?? W(e, "rotationEulerDegrees") ?? {
			x: 0,
			y: 0,
			z: 0
		},
		scale: W(e, "scale") ?? {
			x: 1,
			y: 1,
			z: 1
		}
	};
}
function Ka(e) {
	let t = e.split("/");
	return t.length === 2 && t.every((e) => e.trim());
}
function qa(e, t, n) {
	if (Array.isArray(e)) {
		for (let r of e) qa(r, t, n);
		return;
	}
	if (!B(e)) return;
	let r = wa(e, "key") ?? wa(e, "Key") ?? wa(e, "faceId") ?? wa(e, "FaceId") ?? t, i = z(e, "value") ?? z(e, "Value");
	if (i != null) {
		let e = Ga(i, r);
		e && n.push(e), qa(i, r, n);
		return;
	}
	let a = Ga(e, r);
	if (a) {
		n.push(a);
		return;
	}
	let o = G(e, "keys") ?? G(e, "Keys") ?? G(e, "_keys") ?? G(e, "m_keys"), s = G(e, "values") ?? G(e, "Values") ?? G(e, "_values") ?? G(e, "m_values");
	if (o && s) {
		for (let e = 0; e < Math.min(o.length, s.length); e++) {
			let t = typeof o[e] == "string" && o[e].trim() ? o[e] : null, r = Ga(s[e], t);
			r && n.push(r);
		}
		return;
	}
	for (let [t, i] of Object.entries(e)) {
		let e = Ka(t) ? t : r, a = Ga(i, e);
		if (a) {
			n.push(a);
			continue;
		}
		qa(i, e, n);
	}
}
var Ja = .01, Ya = .05, Xa = [
	{
		mask: 1,
		prefix: "CL_Hip"
	},
	{
		mask: 2,
		prefix: "CL_Chest"
	},
	{
		mask: 4,
		prefix: "CL_Left_Arm"
	},
	{
		mask: 8,
		prefix: "CL_Right_Arm"
	},
	{
		mask: 16,
		prefix: "CL_Left_Elbow"
	},
	{
		mask: 32,
		prefix: "CL_Right_Elbow"
	}
], Za = (e, t, n) => e?.name && e.name.trim() ? e.name : `${t}:${n}`, Qa = (e) => e ? [
	e.x,
	e.y,
	e.z
] : [
	0,
	0,
	0
], $a = (e, t) => !!e && e.trim() !== "" && (e === t || e.startsWith(`${t}/`)), eo = (e) => !e || !e.trim() ? 2 ** 53 - 1 : e.split("/").length - 1, to = (e) => {
	let t = e.lastIndexOf("/");
	return t <= 0 ? null : e.slice(0, t);
};
function no(e) {
	let t = [], n = [], r = /* @__PURE__ */ new Map(), i = (t, i) => {
		if (r.has(t.pathId)) return;
		let a = n.length;
		n.push(Y({
			index: a,
			partKind: e.partKind,
			name: `${e.partKind}:${Za(t.gameObject, t.scriptName, t.pathId)}`,
			sourcePathId: t.pathId,
			scriptName: t.scriptName,
			enabled: (U(t.raw, "m_Enabled") ?? !0) && t.linkedRendererEnabled !== !1,
			linkedRenderer: t.linkedRenderer ? Y({
				pathId: t.linkedRenderer.pathId,
				name: t.linkedRenderer.name,
				path: t.linkedRenderer.transformPath
			}) : null,
			linkedRendererEnabled: t.linkedRendererEnabled,
			nodeName: t.gameObject?.name ?? null,
			nodePath: t.gameObject?.transformPath ?? null,
			poseRoot: J(t.gameObject?.transformPath),
			shape: i
		})), r.set(t.pathId, a);
	};
	for (let t of e.sphereColliders) i(t, { sphere: {
		offset: Qa(t.center),
		radius: Math.max(0, t.radius ?? Ja)
	} });
	for (let t of e.capsuleColliders) {
		let e = Math.max(0, t.height ?? Ya);
		i(t, { capsule: {
			offset: Qa(t.center),
			radius: Math.max(0, t.radius ?? Ja),
			tail: [
				0,
				Math.fround(e),
				0
			]
		} });
	}
	for (let n of e.panelColliders) i(n, { panel: {
		width: Math.max(0, V(n.raw, "width") ?? n.radius ?? 0),
		height: Math.max(0, V(n.raw, "height") ?? n.height ?? 0)
	} }), t.push(`${e.partKind}: SpringPanelCollider ${Za(n.gameObject, n.scriptName, n.pathId)} was preserved for PJSK runtime; VRMC_springBone has no direct panel collider shape.`);
	let a = [], o = new Map(e.bones.map((e) => [e.pathId, e])), s = (e) => [
		"colliders",
		"sphereColliders",
		"capsuleColliders",
		"panelColliders"
	].flatMap((t) => (G(e, t) ?? []).flatMap((e) => {
		if (!B(e)) return [];
		let t = Ca(e, "m_PathID") ?? 0;
		return t === 0 ? [] : [t];
	}));
	for (let n of e.managers) {
		let i = n.gameObject?.transformPath, c;
		i && i.trim() ? (c = q(e.bones.filter((e) => $a(e.gameObject?.transformPath, i)), (e) => eo(e.gameObject?.transformPath), (e) => e.gameObject?.transformPath), c.length || t.push(`${e.partKind}: SpringManager ${n.pathId} has no SpringBone under ${i}; runtime FindSpringBones(true) would return none.`)) : (t.push(`${e.partKind}: SpringManager ${n.pathId} has no transform path; falling back to serialized springBones.`), c = (G(n.raw, "springBones") ?? []).flatMap((r) => {
			let i = B(r) ? Ca(r, "m_PathID") ?? 0 : 0;
			if (i === 0) return [];
			let a = o.get(i);
			return a || t.push(`${e.partKind}: SpringManager ${n.pathId} references missing SpringBone PathID ${i}.`), a ? [a] : [];
		}));
		for (let n of ro(c)) {
			for (let i of n.bones) {
				let n = s(i.raw), o = [];
				for (let a of n) {
					let n = r.get(a);
					n === void 0 ? t.push(`${e.partKind}: SpringBone ${Za(i.gameObject, i.scriptName, i.pathId)} references unsupported or missing collider PathID ${a}.`) : o.push(n);
				}
				o.length && a.push(Y({
					index: a.length,
					name: `${e.partKind}:${Za(i.gameObject, i.scriptName, i.pathId)}:colliders`,
					partKind: e.partKind,
					sourceSpringBonePathId: i.pathId,
					colliders: o,
					sourceColliderPathIds: n,
					sourceKind: "direct",
					defaultRoot: J(i.gameObject?.transformPath)
				}));
			}
			if (n.bones.length) for (let i of n.bones) {
				let o = H(i.raw, "colliderFlag") ?? 0;
				if (o === 0) continue;
				let s = e.partKind.toLowerCase() === "head" ? null : e, c = Xa.filter((e) => (o & e.mask) !== 0), l = s ? [...s.capsuleColliders, ...s.sphereColliders].filter((e) => e.gameObject?.activeInHierarchy !== !1).filter((e) => c.some((t) => (e.gameObject?.name ?? "").toLowerCase().startsWith(t.prefix.toLowerCase()))) : [], u = l.map((e) => ({
					c: e,
					index: r.get(e.pathId)
				})).filter((e) => e.index !== void 0), d = /* @__PURE__ */ new Map();
				for (let e of u) {
					let t = J(e.c.gameObject?.transformPath) ?? "unknown", n = d.get(t) ?? [];
					n.includes(e.index) || n.push(e.index), d.set(t, n);
				}
				let f = J(i.gameObject?.transformPath), p = f === "body" || f === "sit_body" || f === "guitar_body" ? f : e.partKind.toLowerCase() === "head" || f === "face" ? "body" : null, m = p && d.get(p)?.length ? [...d.get(p)] : [...new Set(u.map((e) => e.index))];
				if (!m.length) {
					t.push(`${e.partKind}: Spring chain ${n.rootName} has colliderFlag ${o}, but no body colliders matched runtime CL_* prefixes [${c.map((e) => e.prefix).join(", ")}].`);
					continue;
				}
				a.push(Y({
					index: a.length,
					name: `${e.partKind}:${n.rootName}:${Za(i.gameObject, i.scriptName, i.pathId)}:colliderFlag:${o}:runtime_body`,
					partKind: (s ?? e).partKind,
					sourceSpringBonePathId: i.pathId,
					colliders: m,
					sourceColliderPathIds: l.map((e) => e.pathId),
					sourceKind: "colliderFlag",
					colliderFlag: o,
					matchedPrefixes: c.map((e) => e.prefix),
					collidersByRoot: d.size ? Object.fromEntries(d) : null,
					defaultRoot: p
				}));
			}
		}
	}
	return {
		colliders: n,
		groups: a,
		warnings: t
	};
}
function ro(e) {
	if (!e.length) return [];
	let t = new Map(e.map((e, t) => [e.pathId, t])), n = (e) => q(e, (e) => eo(e.gameObject?.transformPath), (e) => t.get(e.pathId) ?? 2 ** 53 - 1), r = new Set(e.flatMap((e) => [e.pivotNode?.transformPath, e.gameObject?.transformPath]).filter((e) => !!e && !!e.trim())), i = q([...r].filter((e) => {
		let t = to(e);
		return t === null || !r.has(t);
	}), (e) => eo(e), (e) => e);
	if (!i.length) return [{
		rootName: "unresolved",
		bones: n(e)
	}];
	let a = /* @__PURE__ */ new Set(), o = [];
	for (let t of i) {
		let r = e.filter((e) => !a.has(e.pathId) && ($a(e.gameObject?.transformPath, t) || $a(e.pivotNode?.transformPath, t)));
		if (r.length) {
			for (let e of r) a.add(e.pathId);
			o.push({
				rootName: t.split("/").pop(),
				bones: n(r)
			});
		}
	}
	let s = e.filter((e) => !a.has(e.pathId));
	return s.length && o.push({
		rootName: "unresolved",
		bones: n(s)
	}), o;
}
function io(e, t) {
	let n = e[t];
	if (!B(n)) return null;
	let r = (e) => Ea(n[e]);
	return Y({
		active: r("active") ?? r("enabled") ?? r("Active") ?? r("Enabled") ?? r("m_Enabled") ?? !0,
		min: Oa(n, "min"),
		max: Oa(n, "max")
	});
}
function ao(e, t) {
	let n = (e, t) => (G(e, t) ?? []).flatMap((e) => {
		let t = B(e) ? Ca(e, "m_PathID") : null;
		return t !== null && t !== 0 ? [t] : [];
	});
	return e.forceProviders.filter((e) => {
		let r = [
			...n(e.raw, "springManager"),
			...n(e.raw, "springManagers"),
			...n(e.raw, "SpringManager"),
			...n(e.raw, "<SpringManager>k__BackingField"),
			...n(e.raw, "_SpringManager_k__BackingField")
		][0] ?? 0;
		return r === t.pathId || r === 0 && J(e.gameObject?.transformPath) === J(t.gameObject?.transformPath);
	}).map((e) => Y({
		sourcePathId: e.pathId,
		scriptName: e.scriptName,
		nodeName: e.gameObject?.name ?? null,
		nodePath: e.gameObject?.transformPath ?? null,
		activeSelf: e.gameObject?.activeSelf ?? null,
		activeInHierarchy: e.gameObject?.activeInHierarchy ?? null,
		springManagerPathId: t.pathId,
		raw: e.raw
	}));
}
var oo = [
	"CL_Hip",
	"CL_Chest",
	"CL_Left_Arm",
	"CL_Right_Arm",
	"CL_Left_Elbow",
	"CL_Right_Elbow"
];
function so(e, t) {
	let n = e === "body" ? "Body" : "Head", r = no(t), i = t.managers.map((e) => Y({
		partKind: n,
		pathId: e.pathId,
		nodeName: e.gameObject?.name ?? null,
		nodePath: e.gameObject?.transformPath ?? null,
		poseRoot: J(e.gameObject?.transformPath),
		activeSelf: e.gameObject?.activeSelf ?? null,
		activeInHierarchy: e.gameObject?.activeInHierarchy ?? null,
		enabled: Da(e.raw, "m_Enabled", !0),
		automaticUpdates: Da(e.raw, "automaticUpdates", !0),
		enableLengthLimits: Da(e.raw, "enableLengthLimits", !0),
		enableAngleLimits: Da(e.raw, "enableAngleLimits", !0),
		enableCollision: Da(e.raw, "enableCollision", !0),
		collideWithGround: Da(e.raw, "collideWithGround", !1),
		groundHeight: K(e.raw, "groundHeight", 0),
		isSumOfForcesOnBone: Da(e.raw, "isSumOfForcesOnBone", !0),
		isPaused: Da(e.raw, "isPaused", !1),
		dynamicRatio: K(e.raw, "dynamicRatio", 1),
		simulationFrameRate: Math.trunc(K(e.raw, "simulationFrameRate", 60)),
		slowMotionScale: K(e.raw, "slowMotionScale", 1),
		bounce: K(e.raw, "bounce", 0),
		friction: K(e.raw, "friction", 0),
		animatedBoneNames: [],
		rawGravity: ka(e.raw, "gravity"),
		forceProviders: ao(t, e),
		bonePathIds: t.bones.filter((t) => {
			let n = t.raw.m_manager, r = B(n) ? Number(String(n.m_PathID)) : NaN;
			return Number.isFinite(r) && r === e.pathId;
		}).map((e) => e.pathId)
	})), a = t.bones.map((e) => {
		let t = ka(e.raw, "gravityDir");
		return Y({
			partKind: n,
			pathId: e.pathId,
			nodeName: e.gameObject?.name ?? null,
			nodePath: e.gameObject?.transformPath ?? null,
			poseRoot: J(e.gameObject?.transformPath),
			activeSelf: e.gameObject?.activeSelf ?? null,
			activeInHierarchy: e.gameObject?.activeInHierarchy ?? null,
			enabled: Da(e.raw, "m_Enabled", !0),
			pivotNodePath: e.pivotNode?.transformPath ?? null,
			pivotNodeName: e.pivotNode?.name ?? null,
			pivotSourcePathId: e.pivotNode?.pathId ?? null,
			hitRadius: e.radius ?? 0,
			stiffness: e.stiffnessForce ?? 0,
			dragForce: e.dragForce ?? 0,
			gravityPower: K(e.raw, "gravityPower", 0),
			gravityDir: t ? [
				t.x,
				t.y,
				t.z
			] : [
				0,
				-1,
				0
			],
			rawStiffnessForce: e.stiffnessForce,
			rawDragForce: e.dragForce,
			rawSpringForce: e.springForce,
			rawWindInfluence: e.windInfluence,
			rawAngularStiffness: Oa(e.raw, "angularStiffness"),
			rawSpringConstant: Oa(e.raw, "SpringConstant") ?? Oa(e.raw, "springConstant"),
			lengthLimitTargets: e.lengthLimitTargets.map((e) => Y({
				name: e.name ?? null,
				path: e.transformPath ?? null,
				pathId: e.pathId
			})),
			rawAngleLimits: Y({
				y: io(e.raw, "yAngleLimits"),
				z: io(e.raw, "zAngleLimits")
			}),
			directColliderPathIds: e.colliders.map((e) => e.pathId),
			colliderFlag: Math.trunc(K(e.raw, "colliderFlag", 0))
		});
	}), o = r.colliders.filter((e) => String(e.partKind).toLowerCase() === n.toLowerCase()).map((e) => Y({
		partKind: e.partKind,
		index: e.index,
		pathId: e.sourcePathId,
		scriptName: e.scriptName,
		nodeName: e.nodeName,
		nodePath: e.nodePath,
		poseRoot: e.poseRoot,
		enabled: e.enabled,
		linkedRenderer: e.linkedRenderer,
		linkedRendererEnabled: e.linkedRendererEnabled,
		shape: e.shape
	})), s = n === "Head" ? a.filter((e) => e.colliderFlag > 0).map((e) => {
		let t = e.colliderFlag, r = oo.filter((e, n) => (t & 1 << n) != 0);
		return Y({
			sourceKind: "deferred_body_colliderFlag",
			partKind: n,
			sourceSpringBonePathId: e.pathId,
			colliderFlag: t,
			matchedPrefixes: r,
			collidersByRoot: r.length ? { body: [] } : null,
			defaultRoot: "body",
			sourceColliderPathIds: [],
			colliders: []
		});
	}) : [], c = [...r.groups.filter((e) => String(e.partKind).toLowerCase() === n.toLowerCase()).map((e) => Y({
		sourceKind: e.sourceKind ?? "direct",
		partKind: e.partKind,
		sourceSpringBonePathId: e.sourceSpringBonePathId,
		colliderFlag: e.colliderFlag ?? null,
		matchedPrefixes: e.matchedPrefixes ?? null,
		collidersByRoot: e.collidersByRoot ?? null,
		defaultRoot: e.defaultRoot ?? null,
		sourceColliderPathIds: e.sourceColliderPathIds,
		colliders: e.colliders
	})), ...s], l = [...new Set(t.prefabGraph.transforms.map((e) => J(e.transformPath)).filter((e) => !!e))].sort(Aa), u = l[0] ?? (e === "body" ? "body" : "face"), d = t.prefabGraph.constraints.map((e) => co(t.prefabGraph.partKind, e)), f = d.length ? [...new Set(d.filter((e) => e.status !== "resolved").map((e) => `Constraint ${e.type} at ${e.ownerPath ?? e.ownerName ?? String(e.pathId)} is ${e.status}: ${e.reason}`))] : [`No Unity constraint components were found in this package. AssetStudio supports [${[...Ma].sort(Aa).join(", ")}]; missing [].`];
	return {
		partKind: n,
		prefabGraph: t.prefabGraph,
		managers: i,
		bones: a,
		extraBones: t.extraBones.map((e) => Y({
			...e,
			gameObject: Ia(e.gameObject),
			referenceBone: Ia(e.referenceBone)
		})),
		colliders: o,
		colliderBindings: c,
		managerColliderCaches: i.map((e) => Y({
			managerPathId: e.pathId,
			partKind: e.partKind,
			sourcePoseRoot: e.poseRoot ?? null,
			runtimeRoot: e.poseRoot ?? "unknown",
			managerNodeName: e.nodeName ?? null,
			managerNodePath: e.nodePath ?? null,
			springBonePathIds: e.bonePathIds,
			sphereColliderIndexes: o.filter((e) => B(e.shape) && "sphere" in e.shape).map((e) => e.index),
			capsuleColliderIndexes: o.filter((e) => B(e.shape) && "capsule" in e.shape).map((e) => e.index),
			panelColliderIndexes: o.filter((e) => B(e.shape) && "panel" in e.shape).map((e) => e.index),
			reason: "single-part package cache; viewer composer must re-filter after body collider merge"
		})),
		activeRootProfile: {
			defaultBodyRoot: u,
			activeRoots: l.length ? l : [u],
			inactiveRoots: []
		},
		funit: t.funit,
		constraintSetup: {
			version: "0414",
			sourceKind: "single_part_runtime_package",
			constraints: d,
			warnings: f
		},
		warnings: [.../* @__PURE__ */ new Set([...t.warnings, ...r.warnings])]
	};
}
function co(e, t) {
	let n = t.sources.map((e) => Y({
		sourcePathId: e.sourcePathId,
		sourceName: e.sourceName,
		sourcePath: e.sourcePath,
		weight: e.weight,
		translationOffset: e.translationOffset,
		rotationOffset: e.rotationOffset
	})), r = n.length > 0 && n.every((e) => typeof e.sourcePath == "string" && e.sourcePath.trim() || typeof e.sourceName == "string" && e.sourceName.trim()), i = (typeof t.ownerPath == "string" && t.ownerPath.trim() || typeof t.ownerName == "string" && t.ownerName.trim()) && r ? "resolved" : "unresolved_source";
	return Y({
		partKind: e,
		type: t.type,
		pathId: t.pathId,
		ownerPath: t.ownerPath,
		ownerName: t.ownerName,
		enabled: t.enabled,
		active: t.active,
		weight: t.weight,
		locked: t.locked,
		translationAxis: t.translationAxis,
		rotationAxis: t.rotationAxis,
		translationAtRest: t.translationAtRest,
		rotationAtRest: t.rotationAtRest,
		translationOffset: t.translationOffset,
		rotationOffset: t.rotationOffset,
		aimVector: t.aimVector,
		upVector: t.upVector,
		worldUpVector: t.worldUpVector,
		worldUpType: t.worldUpType,
		worldUpObjectPathId: t.worldUpObjectPathId,
		worldUpObjectName: t.worldUpObjectName,
		worldUpObjectPath: t.worldUpObjectPath,
		sources: n,
		status: i,
		reason: i === "resolved" ? "Constraint source transforms were exported by the AssetStudio runtime payload." : "Constraint component was detected, but owner/source transform path or name is incomplete in the normalized payload."
	});
}
function lo(e) {
	let t = {};
	if (e.characterHair) {
		let n = e.characterHair;
		t.hair = Y({
			pathId: n.pathId,
			scriptName: n.scriptName,
			gameObject: Ia(n.gameObject),
			headTransform: Ia(n.headTransform),
			offset: n.offset,
			raw: n.raw
		});
	}
	if (e.characterEye) {
		let n = e.characterEye;
		t.eye = Y({
			...n,
			gameObject: Ia(n.gameObject)
		});
	}
	return t;
}
//#endregion
//#region src/original/unityMesh.ts
function X(e, t) {
	if (!e) throw Error(t);
}
var uo = [
	4,
	2,
	1,
	1,
	2,
	2,
	1,
	1,
	2,
	2,
	4,
	4
];
function fo(e) {
	let t = (e & 32768) >> 15, n = (e & 31744) >> 10, r = e & 1023;
	return n === 0 ? (t ? -1 : 1) * 2 ** -14 * (r / 1024) : n === 31 ? r ? NaN : (t ? -1 : 1) * Infinity : (t ? -1 : 1) * 2 ** (n - 15) * (1 + r / 1024);
}
function po(e, t) {
	let n = e.m_VertexCount, r = e.m_Channels, i = t ?? e.m_DataSize, a = [];
	for (let e of r) {
		let t = e.dimension & 15;
		t && (X(uo[e.format] !== void 0, `vertex format ${e.format}`), a[e.stream] = Math.max(a[e.stream] ?? 0, e.offset + t * uo[e.format]));
	}
	let o = [], s = 0;
	for (let e = 0; e < a.length; e++) o[e] = s, s += (a[e] ?? 0) * n, s = Math.ceil(s / 16) * 16;
	X(i.length >= s - 15, `vertex data ${i.length} bytes, layout needs ${s}`);
	let c = new DataView(i.buffer, i.byteOffset, i.byteLength);
	return {
		vertexCount: n,
		channel(e) {
			let t = r[e], s = t ? t.dimension & 15 : 0;
			if (!t || !s) return null;
			let l = uo[t.format], u = a[t.stream], d = o[t.stream] + t.offset;
			X(d + u * (n - 1) + s * l <= i.length, `channel ${e} exceeds vertex data`);
			let f = t.format >= 6 ? new Uint32Array(n * s) : new Float32Array(n * s);
			for (let e = 0; e < n; e++) for (let n = 0; n < s; n++) {
				let r = d + e * u + n * l, i;
				switch (t.format) {
					case 0:
						i = c.getFloat32(r, !0);
						break;
					case 1:
						i = fo(c.getUint16(r, !0));
						break;
					case 2:
						i = c.getUint8(r) / 255;
						break;
					case 3:
						i = Math.max(c.getInt8(r) / 127, -1);
						break;
					case 4:
						i = c.getUint16(r, !0) / 65535;
						break;
					case 5:
						i = Math.max(c.getInt16(r, !0) / 32767, -1);
						break;
					case 6:
						i = c.getUint8(r);
						break;
					case 7:
						i = c.getInt8(r);
						break;
					case 8:
						i = c.getUint16(r, !0);
						break;
					case 9:
						i = c.getInt16(r, !0);
						break;
					case 10:
						i = c.getUint32(r, !0);
						break;
					default:
						i = c.getInt32(r, !0);
						break;
				}
				f[e * s + n] = i;
			}
			return {
				dimension: s,
				values: f
			};
		}
	};
}
function mo(e, t, n) {
	let r = (t, n) => e[`e${t}${n}`], i = (e, t) => e === 0 == (t === 0) ? 1 : -1;
	for (let e = 0; e < 4; e++) for (let a = 0; a < 4; a++) t[n + e * 4 + a] = i(a, e) * r(a, e);
}
function ho(e, t) {
	X(e.m_MeshCompression === 0, `${e.m_Name}: compressed meshes are not supported`), X(e.m_VariableBoneCountWeights.m_Data.length === 0, `${e.m_Name}: variable bone count weights`);
	let n = e.m_StreamData.path ? t(e.m_StreamData.path, Number(e.m_StreamData.offset), e.m_StreamData.size) : null, r = po(e.m_VertexData, n), i = r.vertexCount, a = (e, t = !1) => {
		if (!e) return null;
		let n = e.dimension, r = new Float32Array(i * (t ? 4 : 3));
		for (let a = 0; a < i; a++) r[a * (t ? 4 : 3)] = -e.values[a * n], r[a * (t ? 4 : 3) + 1] = e.values[a * n + 1], r[a * (t ? 4 : 3) + 2] = e.values[a * n + 2], t && (r[a * 4 + 3] = -e.values[a * n + 3]);
		return r;
	}, o = r.channel(0);
	X(o && o.dimension >= 3, `${e.m_Name}: no position channel`);
	let s = a(o), c = a(r.channel(1)), l = r.channel(2), u = l && l.dimension === 4 ? a(l, !0) : null, d = r.channel(3), f = null;
	if (d) {
		f = new Float32Array(i * 4);
		for (let e = 0; e < i; e++) for (let t = 0; t < 4; t++) f[e * 4 + t] = t < d.dimension ? d.values[e * d.dimension + t] : 1;
	}
	let p = [
		4,
		5,
		6
	].map((e) => {
		let t = r.channel(e);
		if (!t) return null;
		let n = new Float32Array(i * 2);
		for (let e = 0; e < i; e++) n[e * 2] = t.values[e * t.dimension], n[e * 2 + 1] = t.dimension > 1 ? t.values[e * t.dimension + 1] : 0;
		return n;
	}), m = r.channel(13), h = r.channel(12), g = null, _ = null;
	if (m) {
		g = new Uint16Array(i * 4), _ = new Float32Array(i * 4);
		let t = m.dimension, n = h?.dimension ?? 0;
		X(!h || n === t || t === 1 && !h, `${e.m_Name}: bone index / weight dimensions ${t} / ${n}`);
		for (let e = 0; e < i; e++) for (let r = 0; r < t; r++) g[e * 4 + r] = m.values[e * t + r], _[e * 4 + r] = h ? h.values[e * n + r] : 1;
	}
	let v = e.m_IndexFormat === 0 ? 2 : 4, y = e.m_IndexBuffer, b = new DataView(y.buffer, y.byteOffset, y.byteLength), x = [], S = 0;
	for (let t of e.m_SubMeshes) {
		X(t.topology === 0, `${e.m_Name}: sub-mesh topology ${t.topology} (only triangles)`), X(t.indexCount % 3 == 0, `${e.m_Name}: index count ${t.indexCount}`);
		let n = new Uint32Array(t.indexCount), r = t.firstByte;
		X(r + t.indexCount * v <= y.length, `${e.m_Name}: sub-mesh exceeds index buffer`);
		let a = (e) => (v === 2 ? b.getUint16(r + e * 2, !0) : b.getUint32(r + e * 4, !0)) + t.baseVertex;
		for (let e = 0; e < t.indexCount; e += 3) n[e] = a(e + 2), n[e + 1] = a(e + 1), n[e + 2] = a(e);
		for (let t of n) X(t < i, `${e.m_Name}: vertex index ${t} out of range`);
		x.push({
			start: S,
			count: n.length,
			indices: n
		}), S += n.length;
	}
	let ee = new Float32Array(e.m_BindPose.length * 16);
	e.m_BindPose.forEach((e, t) => mo(e, ee, t * 16));
	let C = e.m_Shapes, w = C.channels.map((t) => {
		X(t.frameCount === 1, `${e.m_Name}: blend shape ${t.name} has ${t.frameCount} frames`), X(C.fullWeights[t.frameIndex] === 100, `${e.m_Name}: blend shape ${t.name} full weight ${C.fullWeights[t.frameIndex]}`);
		let n = C.shapes[t.frameIndex], r = n.vertexCount, a = new Uint32Array(r), o = new Float32Array(r * 3), s = n.hasNormals ? new Float32Array(r * 3) : null, c = n.hasTangents ? new Float32Array(r * 3) : null;
		for (let l = 0; l < r; l++) {
			let r = C.vertices[n.firstVertex + l];
			X(r.index < i, `${e.m_Name}: blend shape vertex ${r.index}`), X(l === 0 || r.index > a[l - 1], `${e.m_Name}: blend shape ${t.name} vertices not ascending`), a[l] = r.index, o[l * 3] = -r.vertex.x, o[l * 3 + 1] = r.vertex.y, o[l * 3 + 2] = r.vertex.z, s && (s[l * 3] = -r.normal.x, s[l * 3 + 1] = r.normal.y, s[l * 3 + 2] = r.normal.z), c && (c[l * 3] = -r.tangent.x, c[l * 3 + 1] = r.tangent.y, c[l * 3 + 2] = r.tangent.z);
		}
		return {
			name: t.name,
			indices: a,
			positionDeltas: o,
			normalDeltas: s,
			tangentDeltas: c
		};
	});
	return {
		name: e.m_Name,
		vertexCount: i,
		positions: s,
		normals: c,
		tangents: u,
		colors: f,
		uv: p,
		skinIndices: g,
		skinWeights: _,
		submeshes: x,
		bindPoses: ee,
		morphs: w
	};
}
//#endregion
//#region src/original/partBuilder.ts
function Z(e, t) {
	if (!e) throw Error(t);
}
var go = (e, t) => `original:${e}:${t}`, _o = (() => {
	let e = /* @__PURE__ */ new Uint32Array(256);
	for (let t = 0; t < 256; t++) {
		let n = t;
		for (let e = 0; e < 8; e++) n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
		e[t] = n >>> 0;
	}
	return e;
})();
function vo(e) {
	let t = new TextEncoder().encode(e), n = 4294967295;
	for (let e of t) n = _o[(n ^ e) & 255] ^ n >>> 8;
	return (n ^ 4294967295) >>> 0;
}
function yo(e, t, n) {
	if (t.m_PathID === 0n) return null;
	let r = t.m_FileID === 0 ? e : (() => {
		let r = e.externalCab(t.m_FileID);
		return r ? n(r) : null;
	})();
	Z(r, `${e.name}: texture ${t.m_FileID}:${t.m_PathID} is in a bundle that is not loaded`);
	let i = r.object(t.m_PathID);
	return Z(i && i.classId === k.Texture2D, `${r.name}: ${t.m_PathID} is not a Texture2D`), {
		bundle: r,
		object: i
	};
}
function bo(e, t, n, r) {
	let i = r?.object.read();
	return {
		name: e,
		textureName: i?.m_Name ?? null,
		textureFileId: t.m_FileID,
		texturePathId: Number(t.m_PathID),
		textureKey: t.m_PathID === 0n ? null : `ref:${t.m_FileID}:${t.m_PathID}`,
		scaleX: n.m_Scale.x,
		scaleY: n.m_Scale.y,
		offsetX: n.m_Offset.x,
		offsetY: n.m_Offset.y,
		colorSpace: i?.m_ColorSpace ?? 0,
		uri: r ? go(r.bundle.cabName, r.object.pathId) : null,
		sourceWidth: i?.m_Width ?? 0,
		sourceHeight: i?.m_Height ?? 0,
		sourceMipCount: i?.m_MipCount ?? 0,
		sourceFormat: i?.m_TextureFormat ?? 0,
		filterMode: i?.m_TextureSettings.m_FilterMode ?? 0,
		anisoLevel: i?.m_TextureSettings.m_Aniso ?? 0,
		mipBias: i?.m_TextureSettings.m_MipBias ?? 0,
		wrapU: i?.m_TextureSettings.m_WrapU ?? 0,
		wrapV: i?.m_TextureSettings.m_WrapV ?? 0,
		wrapW: i?.m_TextureSettings.m_WrapW ?? 0
	};
}
function xo(e, t, n) {
	let r = t.m_SavedProperties;
	return {
		shaderFileId: t.m_Shader.m_FileID,
		shaderPathId: Number(t.m_Shader.m_PathID),
		shaderKey: `ref:${t.m_Shader.m_FileID}:${t.m_Shader.m_PathID}`,
		textureProperties: r.m_TexEnvs.map((t) => bo(t.first, t.second.m_Texture, t.second, yo(e, t.second.m_Texture, n))),
		colorProperties: r.m_Colors.map((e) => ({
			name: e.first,
			...e.second
		})),
		floatProperties: r.m_Floats.map((e) => ({
			name: e.first,
			value: e.second
		})),
		intProperties: r.m_Ints.map((e) => ({
			name: e.first,
			value: e.second
		})),
		validKeywords: [...t.m_ValidKeywords],
		invalidKeywords: [...t.m_InvalidKeywords],
		lightmapFlags: t.m_LightmapFlags,
		enableInstancingVariants: t.m_EnableInstancingVariants,
		doubleSidedGi: t.m_DoubleSidedGI,
		customRenderQueue: t.m_CustomRenderQueue,
		stringTags: Object.fromEntries(t.stringTagMap.map((e) => [e.first, e.second])),
		disabledShaderPasses: [...t.disabledShaderPasses]
	};
}
function So(e, t, n) {
	let r = t.toLowerCase();
	return e === "body" ? r.includes("skin") ? "skin" : "body" : e === "head_optional" ? "accessory" : r.includes("eyelash") ? "eyelash" : r.includes("eyebrow") ? "eyebrow" : r.includes("eye_highlight") || r.includes("_ehl_") ? "eyelight" : r.includes("_eye") ? "eye" : r.includes("_hair_") ? "hair" : r.includes("_acc_") ? "accessory" : n ? "face_sdf" : "face";
}
function Co(e, t) {
	let n = e.assetBundle.m_Container.filter((n) => {
		let r = n.first.split("/").pop().replace(/\.[^.]+$/, "");
		return e.local(n.second.asset)?.classId === k.Texture2D && r.toLowerCase() === t.toLowerCase();
	});
	return Z(n.length === 1, `${e.name}: ${n.length} textures named ${t}`), e.local(n[0].second.asset);
}
var wo = {
	body: "body",
	head: "face",
	hair: "face",
	head_optional: "optional"
};
function To(e) {
	let { entry: t, partType: n, bundle: r } = e, i = wo[n], a = r.resource(i, `/${r.name}/${i}.prefab`), o = n === "body" ? "Body" : "Head", s = Ra(r, a.objects, o, r.name), c = so(n, s), l = n === "body" ? "Body" : n === "head_optional" ? "Accessory" : "Head", u = s.prefabGraph, d = new Map(u.transforms.map((e) => [e.pathId, e.transformPath])), f = [], p = [], m = [], h = /* @__PURE__ */ new Set();
	for (let t of u.renderers) {
		if (!t.enabled) continue;
		let i = a.objects.find((e) => Number(e.pathId) === t.pathId), o = i.read(), s = null;
		if (i.classId === k.SkinnedMeshRenderer) s = o.m_Mesh ?? null;
		else {
			let e = r.read(o.m_GameObject).m_Component.map((e) => r.local(e.component)).find((e) => e?.classId === k.MeshFilter);
			s = e ? e.read().m_Mesh : null;
		}
		let c = r.local(s);
		if (!c) {
			f.push(`${l} renderer '${t.transformPath}' has no mesh.`);
			continue;
		}
		let u = ho(c.read(), (e, t, n) => r.stream(e, t, n)), g = u.bindPoses.length / 16, _ = o.m_Bones ?? [];
		Z(_.length === 0 || _.length >= g, `${t.transformPath}: ${_.length} bones for ${g} bind poses`);
		let v = _.slice(0, g), y = /* @__PURE__ */ new Set();
		if (u.skinIndices && u.skinWeights) for (let e = 0; e < u.skinIndices.length; e++) u.skinWeights[e] !== 0 && (Z(u.skinIndices[e] < v.length, `${t.transformPath}: vertex bone index ${u.skinIndices[e]} >= ${v.length}`), y.add(u.skinIndices[e]));
		let b = v.map((e, n) => {
			if (Number(e.m_PathID) === 0) return Z(!y.has(n), `${t.transformPath}: vertices weigh on the empty bone slot ${n}`), "";
			let r = d.get(Number(e.m_PathID));
			return Z(r, `${t.transformPath}: bone ${e.m_PathID} is not in the prefab`), r;
		});
		Z(u.submeshes.length <= o.m_Materials.length, `${t.transformPath}: ${u.submeshes.length} sub-meshes, ${o.m_Materials.length} materials`);
		let x = t.transformPath.split("/").pop(), S = t.rootBonePathId === void 0 ? null : d.get(t.rootBonePathId) ?? null, ee = u.submeshes.map((i, a) => {
			let s = o.m_Materials[a];
			Z(s.m_PathID !== 0n && s.m_FileID === 0, `${t.transformPath}: material slot ${a} is empty or external`);
			let c = r.local(s).read(), l = `${s.m_FileID}:${s.m_PathID}`, u = `${x}::${a}::${l}`;
			if (!h.has(u)) {
				h.add(u);
				let i = xo(r, c, e.resolveBundle), o = i.textureProperties.some((e) => e.name === "_FaceShadowTex" && e.texturePathId !== 0);
				m.push({
					part: n,
					meshName: x,
					slotIndex: a,
					materialKey: l,
					materialFileId: s.m_FileID,
					materialPathId: Number(s.m_PathID),
					materialName: c.m_Name,
					materialKind: So(n, c.m_Name, o),
					isAccessory: n === "head_optional",
					rawMaterial: i,
					rendererPathId: t.pathId
				});
			}
			return {
				slotIndex: a,
				materialKey: l,
				materialFileId: s.m_FileID,
				materialPathId: Number(s.m_PathID),
				materialName: c.m_Name,
				start: i.start,
				count: i.count,
				indices: i.indices
			};
		}), C = u.vertexCount;
		p.push({
			partKind: l,
			meshPath: t.transformPath,
			meshName: x,
			rendererPathId: t.pathId,
			rendererTransformPathId: t.transformPathId,
			rendererTransformPath: t.transformPath,
			rootBonePathId: t.rootBonePathId ?? null,
			rootBonePath: S,
			bonePathIds: v.map((e) => Number(e.m_PathID)),
			bonePaths: b,
			boneInverseBindMatrices: v.length ? u.bindPoses : /* @__PURE__ */ new Float32Array(),
			submeshes: ee,
			positions: u.positions,
			normals: u.normals ?? new Float32Array(C * 3).map((e, t) => +(t % 3 == 1)),
			tangents: u.tangents ?? /* @__PURE__ */ new Float32Array(),
			uv0: u.uv[0] ?? new Float32Array(C * 2),
			uv1: u.uv[1] ?? /* @__PURE__ */ new Float32Array(),
			uv2: u.uv[2] ?? /* @__PURE__ */ new Float32Array(),
			...u.colors ? { colors: u.colors } : {},
			...v.length && u.skinIndices ? {
				skinIndices: u.skinIndices,
				skinWeights: u.skinWeights
			} : {},
			morphTargets: u.morphs.map((e) => ({
				name: e.name,
				indices: e.indices,
				hasPositionDeltas: !0,
				positionDeltas: e.positionDeltas,
				hasNormalDeltas: e.normalDeltas !== null,
				normalDeltas: e.normalDeltas ?? /* @__PURE__ */ new Float32Array(),
				hasTangentDeltas: e.tangentDeltas !== null,
				tangentDeltas: e.tangentDeltas ?? /* @__PURE__ */ new Float32Array()
			}))
		});
	}
	if (Z(p.length > 0 || n === "head_optional", `${r.name}: ${i} has no renderers`), e.colorBundle && (n === "body" || n === "head_optional")) {
		let t = n === "body" ? "tex_body" : "tex_acc", i = n === "body" ? u.renderers.find((e) => e.typeName === "SkinnedMeshRenderer") : u.renderers.find((e) => e.typeName === "MeshRenderer");
		Z(i, `${r.name}: no renderer for the color variation`);
		let a = m.find((e) => e.rendererPathId === i.pathId && e.slotIndex === 0);
		Z(a, `${r.name}: renderer ${i.transformPath} has no material`);
		let o = e.colorBundle, s = {
			_MainTex: Co(o, `${t}_C`),
			_ShadowTex: Co(o, `${t}_S`),
			_ValueTex: Co(o, `${t}_H`)
		}, c = a.rawMaterial;
		c.textureProperties = c.textureProperties.map((e) => {
			let t = s[e.name];
			if (!t) return e;
			let n = {
				m_FileID: 0,
				m_PathID: t.pathId
			};
			return {
				...bo(e.name, n, {
					m_Scale: {
						x: e.scaleX,
						y: e.scaleY
					},
					m_Offset: {
						x: e.offsetX,
						y: e.offsetY
					}
				}, {
					bundle: o,
					object: t
				}),
				textureKey: `ref:color:${t.pathId}`
			};
		});
	}
	for (let e of m) delete e.rendererPathId;
	let g = a.root.read().m_Name, _ = n === "head_optional" && s.accessoryTransformAdjustments.length ? Object.fromEntries(s.accessoryTransformAdjustments.map((e) => [e.faceId, {
		position: e.position,
		rotationEulerDegrees: e.rotationEulerDegrees,
		scale: e.scale
	}])) : null;
	return {
		version: "original-1",
		packagePath: t.packagePath,
		part: {
			costume3dId: t.costume3dId,
			partType: n,
			characterId: t.characterId,
			unit: t.unit ?? null,
			name: t.name ?? null,
			modelAssetbundleName: t.modelAssetbundleName ?? null,
			headCostume3dAssetbundleType: t.headCostume3dAssetbundleType ?? null
		},
		source: {
			bundlePath: r.name,
			colorVariationBundlePath: e.colorBundle?.name ?? null
		},
		mount: {
			mountKind: n === "body" ? "character_root" : n === "head_optional" ? "attach_node" : "head_origin",
			rootNodeName: g,
			attachNode: e.attachNode ?? null,
			..._ ? { accessoryTransformAdjustments: _ } : {}
		},
		nativeMeshes: {
			version: "0414",
			coordinateSpace: "assetstudio-modelconverter-viewer-space",
			meshes: p,
			warnings: f
		},
		materialSlots: m,
		springBone: c,
		characterControllers: lo(s),
		warnings: [...c.warnings, ...f]
	};
}
//#endregion
//#region src/engine/unityPlayableAnimator.ts
var Q = Math.fround, Eo = /* @__PURE__ */ function(e) {
	return e[e.FollowAnimationClip = 0] = "FollowAnimationClip", e[e.Loop = 1] = "Loop", e[e.Clamp = 2] = "Clamp", e;
}({}), Do = /* @__PURE__ */ function(e) {
	return e[e.BuildUp = 0] = "BuildUp", e[e.Recycle = 1] = "Recycle", e;
}({}), Oo = class {
	clip;
	time = 0;
	speed = 1;
	playState = 1;
	length;
	constructor(e) {
		this.clip = e, this.length = ba(e);
	}
	getTime() {
		return this.time;
	}
	setTime(e) {
		this.time = e, this.timeSet = !0;
	}
	timeSet = !1;
	getSpeed() {
		return this.speed;
	}
	setSpeed(e) {
		this.speed = e;
	}
	getPlayState() {
		return this.playState;
	}
	play() {
		this.playState = 1;
	}
	pause() {
		this.playState = 0;
	}
	clipTime() {
		let e = this.length, t = Q(this.time);
		return t = this.clip.isLooping ? e > 0 ? Q(t - Q(Math.floor(t / e) * e)) : 0 : Math.min(Math.max(t, 0), e), Q(this.clip.startTime + t);
	}
}, ko = class {
	normalizeWeights;
	inputs;
	weights;
	constructor(e, t) {
		this.normalizeWeights = t, this.inputs = Array.from({ length: e }, () => null), this.weights = Array.from({ length: e }, () => 0);
	}
	getInputCount() {
		return this.inputs.length;
	}
	getInput(e) {
		return this.inputs[e] ?? null;
	}
	addInput(e, t) {
		return this.inputs.push(e), this.weights.push(t), this.inputs.length - 1;
	}
	connectInput(e, t) {
		if (this.inputs[e]) throw Error(`mixer input ${e} is already connected`);
		this.inputs[e] = t;
	}
	disconnectInput(e) {
		this.inputs[e] = null;
	}
	getInputWeight(e) {
		return this.weights[e];
	}
	setInputWeight(e, t) {
		this.weights[e] = t;
	}
}, Ao = class {
	inputs = [];
	weights = [];
	addInput(e, t) {
		this.inputs.push(e), this.weights.push(t);
	}
	getInputCount() {
		return this.inputs.length;
	}
	getInputWeight(e) {
		return this.weights[e];
	}
	setInputWeight(e, t) {
		this.weights[e] = t;
	}
};
function jo(e, t, n) {
	return t === ga.Transform ? `t:${e}:${n === _a.EulerAngles ? _a.Rotation : n}` : `b:${e}:${n}`;
}
var Mo = class {
	root;
	renderedMeshes;
	nodeByPathCrc = /* @__PURE__ */ new Map();
	properties = /* @__PURE__ */ new Map();
	ordered = [];
	bufferSize = 0;
	constructor(e, t) {
		this.root = e, this.renderedMeshes = t;
		let n = (e, t) => {
			let r = vo(t);
			this.nodeByPathCrc.has(r) || this.nodeByPathCrc.set(r, e);
			for (let r of e.children) n(r, t ? `${t}/${r.name}` : r.name);
		};
		n(e, "");
	}
	bindClip(e) {
		for (let t of e.bindings) {
			let e = jo(t.path, t.typeID, t.attribute);
			if (this.properties.has(e)) continue;
			let n = this.nodeByPathCrc.get(t.path);
			if (!n) continue;
			let r = null;
			if (t.typeID === ga.Transform) {
				let e = t.attribute === _a.Position ? 0 : t.attribute === _a.Scale ? 2 : 1, i = e === 1 ? 4 : 3, a = new Float64Array(i);
				e === 0 ? a.set([
					-n.position.x,
					n.position.y,
					n.position.z
				]) : e === 2 ? a.set([
					n.scale.x,
					n.scale.y,
					n.scale.z
				]) : a.set([
					n.quaternion.x,
					-n.quaternion.y,
					-n.quaternion.z,
					n.quaternion.w
				]), r = {
					kind: e,
					node: n,
					morphs: [],
					defaults: a,
					offset: 0,
					size: i
				};
			} else if (t.typeID === ga.SkinnedMeshRenderer && t.customType === 20) {
				let e = [];
				for (let r of this.renderedMeshes(n)) {
					let n = r.morphTargetDictionary;
					if (!n || !r.morphTargetInfluences) continue;
					let i = Object.keys(n).find((e) => vo(e) === t.attribute);
					i !== void 0 && e.push({
						mesh: r,
						index: n[i]
					});
				}
				if (!e.length) continue;
				r = {
					kind: 3,
					node: n,
					morphs: e,
					defaults: new Float64Array([e[0].mesh.morphTargetInfluences[e[0].index] * 100]),
					offset: 0,
					size: 1
				};
			}
			r && (r.offset = this.bufferSize, this.bufferSize += r.size, this.properties.set(e, r), this.ordered.push(r));
		}
	}
	get size() {
		return this.bufferSize;
	}
	propertyFor(e, t, n) {
		return this.properties.get(jo(e, t, n)) ?? null;
	}
	writeDefaults(e) {
		for (let t of this.ordered) e.set(t.defaults, t.offset);
	}
	defaultOf(e, t, n) {
		for (let r = 0; r < e.size; r++) t[n + r] = e.defaults[r];
	}
	apply(e) {
		for (let t of this.ordered) {
			let n = t.offset;
			switch (t.kind) {
				case 0:
					t.node.position.set(-e[n], e[n + 1], e[n + 2]);
					break;
				case 2:
					t.node.scale.set(e[n], e[n + 1], e[n + 2]);
					break;
				case 1:
					t.node.quaternion.set(e[n], -e[n + 1], -e[n + 2], e[n + 3]);
					break;
				case 3:
					for (let r of t.morphs) r.mesh.morphTargetInfluences[r.index] = e[n] / 100;
					break;
			}
		}
	}
	get boundProperties() {
		return this.ordered;
	}
}, No = [
	[
		0,
		1,
		2
	],
	[
		0,
		2,
		1
	],
	[
		1,
		2,
		0
	],
	[
		1,
		0,
		2
	],
	[
		2,
		0,
		1
	],
	[
		2,
		1,
		0
	]
], Po = /* @__PURE__ */ new Float64Array(12);
function Fo(e, t, n, r, i, a) {
	let o = Math.PI / 360, s = [
		e,
		t,
		n
	];
	for (let e = 0; e < 3; e++) {
		let t = e * 4;
		Po[t] = Po[t + 1] = Po[t + 2] = 0, Po[t + e] = Math.sin(s[e] * o), Po[t + 3] = Math.cos(s[e] * o);
	}
	let c = 0, l = 0, u = 0, d = 1;
	for (let e of No[r]) {
		let t = e * 4, n = Po[t], r = Po[t + 1], i = Po[t + 2], a = Po[t + 3], o = a * c + n * d + r * u - i * l, s = a * l - n * u + r * d + i * c, f = a * u + n * l - r * c + i * d, p = a * d - n * c - r * l - i * u;
		c = o, l = s, u = f, d = p;
	}
	i[a] = Q(c), i[a + 1] = Q(l), i[a + 2] = Q(u), i[a + 3] = Q(d);
}
var Io = class {
	target;
	plans = /* @__PURE__ */ new WeakMap();
	samples = /* @__PURE__ */ new WeakMap();
	result = /* @__PURE__ */ new Float64Array();
	layerValue = /* @__PURE__ */ new Float64Array();
	layerMask = /* @__PURE__ */ new Uint8Array();
	animatedMark = /* @__PURE__ */ new Uint8Array();
	quaternion = /* @__PURE__ */ new Float64Array(4);
	constructor(e) {
		this.target = e;
	}
	plan(e) {
		let t = this.plans.get(e);
		if (t) return t;
		t = [];
		for (let n of e.bindings) {
			let r = this.target.propertyFor(n.path, n.typeID, n.attribute);
			if (r) {
				if (t.some((e) => e.property === r)) throw Error(`${e.name}: two bindings write one property (path ${n.path})`);
				if (t.push({
					property: r,
					offset: n.offset,
					euler: n.typeID === ga.Transform && n.attribute === _a.EulerAngles ? n.customType : -1
				}), n.dimension !== va(n.typeID, n.attribute)) throw Error(`${e.name}: binding dimension`);
			}
		}
		return this.plans.set(e, t), t;
	}
	sample(e) {
		let t = this.samples.get(e.clip);
		return t || (t = new Float32Array(e.clip.curveCount), this.samples.set(e.clip, t)), xa(e.clip, e.clipTime(), t);
	}
	evaluate(e) {
		let t = this.target, n = t.size;
		this.result.length !== n && (this.result = new Float64Array(n), this.layerValue = new Float64Array(n), this.layerMask = new Uint8Array(n), this.animatedMark = new Uint8Array(n));
		let r = this.result, i = this.layerValue, a = this.layerMask;
		t.writeDefaults(r);
		let o = this.quaternion;
		for (let n of e) for (let e = 0; e < n.inputs.length; e++) {
			let s = n.weights[e];
			if (!(s > 0)) continue;
			let c = n.inputs[e], l = 0;
			for (let e = 0; e < c.inputs.length; e++) c.inputs[e] && c.weights[e] > 0 && (l += c.weights[e]);
			if (l > 0) {
				a.fill(0), i.fill(0);
				for (let e = 0; e < c.inputs.length; e++) {
					let t = c.inputs[e];
					if (!(!t || !(c.weights[e] > 0))) for (let e of this.plan(t.clip)) a[e.property.offset] = 1;
				}
				for (let e = 0; e < c.inputs.length; e++) {
					let n = c.inputs[e], r = c.weights[e];
					if (!n || !(r > 0)) continue;
					let s = c.normalizeWeights ? r / l : r, u = this.sample(n), d = this.animatedMark;
					d.fill(0);
					for (let e of this.plan(n.clip)) {
						let t = e.property;
						if (d[t.offset] = 1, t.kind === 1) {
							if (e.euler >= 0) Fo(u[e.offset], u[e.offset + 1], u[e.offset + 2], e.euler, o, 0);
							else for (let t = 0; t < 4; t++) o[t] = u[e.offset + t];
							Lo(i, t.offset, o, 0, s);
						} else for (let n = 0; n < t.size; n++) i[t.offset + n] += s * u[e.offset + n];
					}
					for (let e of t.boundProperties) if (!(!a[e.offset] || d[e.offset])) if (e.kind === 1) Lo(i, e.offset, e.defaults, 0, s);
					else for (let t = 0; t < e.size; t++) i[e.offset + t] += s * e.defaults[t];
				}
				if (!c.normalizeWeights && l < 1) {
					for (let e of t.boundProperties) if (a[e.offset]) if (e.kind === 1) Lo(i, e.offset, e.defaults, 0, 1 - l);
					else for (let t = 0; t < e.size; t++) i[e.offset + t] += (1 - l) * e.defaults[t];
				}
				for (let e of t.boundProperties) {
					let t = e.offset;
					if (a[t]) if (e.kind === 1 && Ro(i, t), s >= 1) for (let n = 0; n < e.size; n++) r[t + n] = i[t + n];
					else if (e.kind === 1) {
						for (let e = 0; e < 4; e++) o[e] = r[t + e];
						for (let e = 0; e < 4; e++) r[t + e] = 0;
						Lo(r, t, o, 0, 1 - s), Lo(r, t, i, t, s), Ro(r, t);
					} else for (let n = 0; n < e.size; n++) r[t + n] = r[t + n] + (i[t + n] - r[t + n]) * s;
				}
			}
		}
		t.apply(r);
	}
};
function Lo(e, t, n, r, i) {
	let a = e[t] * n[r] + e[t + 1] * n[r + 1] + e[t + 2] * n[r + 2] + e[t + 3] * n[r + 3] < 0 ? -i : i;
	for (let i = 0; i < 4; i++) e[t + i] += a * n[r + i];
}
function Ro(e, t) {
	let n = Math.hypot(e[t], e[t + 1], e[t + 2], e[t + 3]);
	if (n > 0) for (let r = 0; r < 4; r++) e[t + r] = e[t + r] / n;
	else e.set([
		0,
		0,
		0,
		1
	], t);
}
var zo = class {
	outputs = [];
	evaluator = null;
	boundClips = /* @__PURE__ */ new Set();
	playing = !1;
	createOutput(e) {
		this.outputs.push(e);
	}
	bind(e) {
		this.evaluator = new Io(e), this.boundClips = /* @__PURE__ */ new Set();
	}
	get target() {
		return this.evaluator?.target ?? null;
	}
	connectedClips() {
		let e = [];
		for (let t of this.outputs) for (let n of t.inputs) for (let t of n.inputs) t && e.push(t);
		return e;
	}
	update(e) {
		if (!this.playing) return;
		let t = this.connectedClips();
		for (let n of t) n.timeSet ? n.timeSet = !1 : n.playState === 1 && (n.time += e * n.speed);
		let n = this.evaluator;
		if (n) {
			for (let e of t) this.boundClips.has(e.clip) || (this.boundClips.add(e.clip), n.target.bindClip(e.clip));
			n.evaluate(this.outputs);
		}
	}
}, Bo = class {
	mixer;
	currentIndex = -1;
	currentAnimationName = "";
	prevIndex = -1;
	prevAnimationName = null;
	blendTargetTime = 0;
	blendTime = 0;
	blendFadeOutTargetTime = 0;
	blendFadeOutTime = 0;
	blendForwardIndex = 0;
	blendForwardStartWeight = 0;
	blendBackIndexs;
	blendBackStartWeight;
	blendBackIndexCount = 0;
	blendWeight = 0;
	currentStatus = 0;
	nextUseInputIndex = 0;
	blendTimeScale = 1;
	animationLoopCount = 0;
	currentAnimationClipPlayable = null;
	speed = 1;
	loopType = 0;
	onAnimationFinished = null;
	constructor(e, t = 8) {
		this.mixer = e, this.blendBackIndexs = Array.from({ length: t }, () => 0), this.blendBackStartWeight = Array.from({ length: t }, () => 0);
	}
	setCurrentIndex(e) {
		this.currentIndex = e, this.currentAnimationClipPlayable = e >= 0 ? this.mixer.getInput(e) : null;
	}
	get currentAnimationClip() {
		return this.currentAnimationClipPlayable?.clip ?? null;
	}
	get curentAnimationName() {
		return this.currentAnimationName;
	}
	get previousAnimationName() {
		return this.prevAnimationName;
	}
	get currentTime() {
		return this.currentIndex >= 0 ? this.currentAnimationClipPlayable.getTime() : 0;
	}
	set currentTime(e) {
		this.currentIndex >= 0 && this.currentAnimationClipPlayable.setTime(e);
	}
	get currentNormalizeTime() {
		return this.currentIndex >= 0 ? Q(this.currentAnimationClipPlayable.getTime()) / this.currentAnimationClipPlayable.length : 0;
	}
	set currentNormalizeTime(e) {
		this.currentIndex >= 0 && this.currentAnimationClipPlayable.setTime(this.currentAnimationClipPlayable.length * e);
	}
	update(e) {
		switch (this.currentStatus) {
			case 0:
				this.updateCommonProcess();
				break;
			case 1:
				this.updateBlending(e);
				break;
			case 2:
				this.updateOffBlending(e);
				break;
			case 3: break;
		}
	}
	timeUpdateDeltaTime(e) {
		let t = Q(e * this.blendTimeScale);
		this.blendTime = Q(this.blendTime + t), this.blendFadeOutTime = Q(t + this.blendFadeOutTime);
	}
	setBlendTimeScale(e) {
		this.blendTimeScale = e;
	}
	updateCommonProcess() {
		if (this.currentIndex < 0) return;
		let e = this.currentAnimationClipPlayable, t = e.length, n = e.getTime();
		if (e.getPlayState() !== 1 && e.play(), n > t) switch (this.loopType) {
			case 0: {
				let r = e.clip.isLooping;
				this.animationLoopCount++, r ? (e.setTime(n - t), this.onAnimationFinished?.(this.currentAnimationName, this.animationLoopCount)) : this.animationLoopCount === 1 && (this.onAnimationFinished?.(this.currentAnimationName, 1), e.setSpeed(0));
				break;
			}
			case 1:
				this.animationLoopCount++, e.setTime(n - t), this.onAnimationFinished?.(this.currentAnimationName, this.animationLoopCount);
				break;
			case 2:
				this.animationLoopCount++, e.setTime(t), this.animationLoopCount === 1 && (this.onAnimationFinished?.(this.currentAnimationName, 1), e.setSpeed(0));
				break;
		}
	}
	updateBlending(e) {
		this.timeUpdateDeltaTime(e);
		let t = 0;
		if (this.blendTime >= this.blendTargetTime ? (this.fitForwardTarget(), t = 1) : (this.blendWeight = Vo(this.blendForwardStartWeight, 1, Q(this.blendTime / this.blendTargetTime)), this.mixer.setInputWeight(this.blendForwardIndex, this.blendWeight)), this.blendFadeOutTime >= this.blendFadeOutTargetTime) this.fitBackTarget(), t |= 2;
		else for (let e = 0; e < this.blendBackIndexCount; e++) this.mixer.setInputWeight(this.blendBackIndexs[e], Vo(this.blendBackStartWeight[e], 0, Q(this.blendFadeOutTime / this.blendFadeOutTargetTime)));
		t === 3 && (this.currentStatus = 0), this.updateCommonProcess();
	}
	updateOffBlending(e) {
		if (this.timeUpdateDeltaTime(e), this.blendTime >= this.blendTargetTime) {
			this.blendTime = this.blendTargetTime;
			for (let e = 0; e < this.blendBackIndexCount; e++) this.mixer.setInputWeight(this.blendBackIndexs[e], 0);
			this.blendBackIndexCount = 0, this.currentStatus = 3;
		} else for (let e = 0; e < this.blendBackIndexCount; e++) this.mixer.setInputWeight(this.blendBackIndexs[e], Vo(this.blendBackStartWeight[e], 0, Q(this.blendTime / this.blendTargetTime)));
	}
	fitForwardTarget() {
		this.blendWeight = 1, this.mixer.setInputWeight(this.blendForwardIndex, 1);
	}
	fitBackTarget() {
		for (let e = 0; e < this.blendBackIndexCount; e++) this.mixer.setInputWeight(this.blendBackIndexs[e], 0);
		this.blendBackIndexCount = 0;
	}
	startOffBlend(e) {
		if (!(this.currentIndex < 0)) {
			this.blendTime = 0, this.blendTargetTime = e, this.blendBackIndexCount < this.blendBackIndexs.length - 1 ? this.blendBackIndexs[this.blendBackIndexCount++] = this.currentIndex : this.blendBackIndexs[0] = this.currentIndex;
			for (let e = 0; e < this.blendBackIndexCount; e++) this.blendBackStartWeight[e] = this.mixer.getInputWeight(this.blendBackIndexs[e]);
			this.prevIndex = this.currentIndex, this.prevAnimationName = this.currentAnimationName, this.setCurrentIndex(-1), this.currentAnimationName = "", this.currentStatus = 2;
		}
	}
	setSpeed(e) {
		this.speed = e, this.currentIndex >= 0 && this.currentAnimationClipPlayable.setSpeed(e);
	}
	startBlend(e, t, n, r, i, a) {
		if (this.currentIndex === e) {
			this.animationLoopCount = 0, this.currentIndex >= 0 && (this.currentAnimationClipPlayable.setSpeed(this.speed), this.currentAnimationClipPlayable.setTime(a), this.currentAnimationClipPlayable.setTime(a));
			return;
		}
		this.blendTime = 0, this.blendTargetTime = t, this.blendFadeOutTargetTime = n, this.loopType = i, this.animationLoopCount = 0, this.blendFadeOutTime = 0, this.blendForwardIndex = e, this.blendForwardStartWeight = this.mixer.getInputWeight(e);
		for (let e = 0; e < this.blendBackIndexCount; e++) if (this.blendBackIndexs[e] === this.blendForwardIndex) {
			for (let t = e; t < this.blendBackIndexCount; t++) this.blendBackIndexs[t] = this.blendBackIndexs[t + 1];
			this.blendBackIndexCount--;
			break;
		}
		this.currentIndex >= 0 && (this.blendBackIndexCount < this.blendBackIndexs.length - 1 ? this.blendBackIndexs[this.blendBackIndexCount++] = this.currentIndex : this.blendBackIndexs[0] = this.currentIndex);
		for (let e = 0; e < this.blendBackIndexCount; e++) this.blendBackStartWeight[e] = this.mixer.getInputWeight(this.blendBackIndexs[e]);
		this.prevIndex = this.currentIndex, this.prevAnimationName = this.currentAnimationName, this.setCurrentIndex(e), this.currentAnimationName = r;
		let o = this.currentAnimationClipPlayable, s = o.length * a;
		o.setTime(s), o.setTime(s), o.setSpeed(this.speed), this.currentStatus = 1;
	}
	startBlendRecycle(e, t, n, r, i, a) {
		let o = this.mixer.getInputCount(), s = 0, c = !1;
		for (let t = 0; t < o; t++) if (this.mixer.getInput(t) === e) {
			s = t, c = !0;
			break;
		}
		if (!c) {
			for (let e = 0; e < o; e++) {
				let e = this.mixer.getInputWeight(this.nextUseInputIndex), t = this.nextUseInputIndex;
				if (this.nextUseInputIndex = (t + 1) % o, !(e > 0)) {
					s = t;
					break;
				}
			}
			this.mixer.getInputWeight(s) > 0 && (s = this.nextUseInputIndex, this.nextUseInputIndex = (s + 1) % o, this.mixer.setInputWeight(s, 0)), this.mixer.disconnectInput(s), this.mixer.connectInput(s, e);
		}
		this.startBlend(s, t, n, r, i, a);
	}
};
function Vo(e, t, n) {
	let r = Math.min(Math.max(n, 0), 1);
	return Q(e + Q(Q(t - e) * r));
}
var Ho = class {
	graph = new zo();
	blenders = [];
	layer = null;
	animationDictonary = /* @__PURE__ */ new Map();
	inputPlayableUseType = 0;
	initialize(e, t = 0, n = 4) {
		this.blenders = [], this.inputPlayableUseType = t;
		for (let r = 0; r < e; r++) {
			let e = new ko(t === 1 ? n : 0, !0);
			this.blenders.push(new Bo(e));
		}
	}
	registerAnimationClip(e, t, n = "", r = !1) {
		let i = this.blenders[e], a = new Oo(t), o = {
			playable: a,
			layerIndex: e,
			inputIndex: i.mixer.getInputCount()
		};
		(this.inputPlayableUseType === 0 || r) && i.mixer.addInput(a, 0), this.animationDictonary.set(n || t.name, o);
	}
	registerAnimationFinishCallBack(e, t) {
		this.blenders[e].onAnimationFinished = t;
	}
	getAnimationTime(e) {
		return this.blenders[e].currentTime;
	}
	setAnimationTime(e, t) {
		this.blenders[e].currentTime = t;
	}
	getAnimationNormalizeTime(e) {
		return this.blenders[e].currentNormalizeTime;
	}
	setAnimationNormalizeTime(e, t) {
		this.blenders[e].currentNormalizeTime = t;
	}
	getCurrentAnimationName(e) {
		return this.blenders[e].curentAnimationName;
	}
	getCurrentAnimationClip(e) {
		return this.animationDictonary.get(this.blenders[e].curentAnimationName)?.playable.clip ?? null;
	}
	finalizeSetup(e, t = !1) {
		let n = new Ao();
		if (this.layer = n, !t) for (let e of this.blenders) n.addInput(e.mixer, 1);
		this.graph.bind(e), this.graph.createOutput(n), this.graph.playing = !0;
	}
	setLayerWeight(e, t) {
		this.layer.getInputCount() <= e || this.layer.setInputWeight(e, t);
	}
	getLayerWeight(e) {
		return this.layer.getInputCount() <= e ? 0 : this.layer.getInputWeight(e);
	}
	changeAnimation(e, t, n, r = 0, i = 0, a = !0) {
		let o = this.animationDictonary.get(t);
		if (!o || this.blenders.length <= e) return null;
		let s = this.blenders[e];
		return !a && t === s.curentAnimationName || (this.inputPlayableUseType === 0 ? s.startBlend(o.inputIndex, n, n, t, r, i) : s.startBlendRecycle(o.playable, n, n, t, r, i)), s;
	}
	changeAnimationOff(e, t) {
		if (this.blenders.length <= e) return null;
		let n = this.blenders[e];
		return n.startOffBlend(t), n;
	}
	existsAnimation(e) {
		return this.animationDictonary.has(e);
	}
	setSpeed(e, t) {
		this.blenders[e]?.setSpeed(t);
	}
	update(e) {
		for (let t of this.blenders) t.update(e);
	}
	blender(e) {
		return this.blenders[e];
	}
}, $ = /* @__PURE__ */ function(e) {
	return e[e.BREATH = 0] = "BREATH", e[e.MOTION = 1] = "MOTION", e[e.MOTION_OVERRIDE = 2] = "MOTION_OVERRIDE", e[e.FACIAL = 3] = "FACIAL", e[e.LIPSYNC = 4] = "LIPSYNC", e[e.BLINK = 5] = "BLINK", e;
}({}), Uo = 6, Wo = 24, Go = "model3d/motion/common/default", Ko = class {
	loadClip;
	playableAnimator = null;
	loopAnimationNameDict = /* @__PURE__ */ new Map([[1, null], [3, null]]);
	currentMotionAssetBundleNameDict = /* @__PURE__ */ new Map();
	lipsyncMotionDict = /* @__PURE__ */ new Map();
	analyzer = null;
	deltaTime = 0;
	constructor(e) {
		this.loadClip = e;
	}
	get animator() {
		return this.playableAnimator;
	}
	load(e, t) {
		return this.loadClip(e, t);
	}
	setup(e) {
		if (this.playableAnimator) this.playableAnimator.finalizeSetup(e, !0);
		else {
			let t = new Ho();
			this.playableAnimator = t, t.initialize(Uo, Do.Recycle, Wo), t.finalizeSetup(e, !1), t.registerAnimationFinishCallBack(1, (e, t) => this.onFinishMotion(1, e, t)), t.registerAnimationFinishCallBack(3, (e, t) => this.onFinishMotion(3, e, t)), this.setupBreath(), this.setupLipSync();
		}
	}
	setupBreath() {
		let e = this.load(Go, "breath_loop");
		if (!e) throw Error(`${Go}/breath_loop is missing`);
		let t = this.playableAnimator;
		t.registerAnimationClip(0, e, e.name, !0), t.changeAnimation(0, e.name, 0, Eo.FollowAnimationClip, 0, !0).update(this.deltaTime);
	}
	setupLipSync() {
		let e = [
			[0, "lipsync_a_01"],
			[1, "lipsync_u_01"],
			[2, "lipsync_e_01"],
			[3, "lipsync_o_01"],
			[4, "lipsync_n_01"]
		];
		for (let [t, n] of e) {
			let e = this.load(Go, n);
			if (!e) throw Error(`${Go}/${n} is missing`);
			this.lipsyncMotionDict.set(t, e);
		}
		for (let [t] of e) {
			let e = this.lipsyncMotionDict.get(t);
			this.playableAnimator.registerAnimationClip(4, e, e.name, !0);
		}
	}
	changeMotionWithLoop(e, t, n, r, i = 0, a = 0) {
		this.setLoopMotion(e, t, r, i), this.changeMotion(e, t, n, i, a) === 1 && this.changeMotion(e, t, r, i, a);
	}
	setLoopMotion(e, t, n, r = 0) {
		let i = `${t}/${n}`, a = this.playableAnimator;
		if (!a.existsAnimation(i)) {
			let r = this.load(t, n);
			if (!r) return this.loopAnimationNameDict.set(e, null), !1;
			a.registerAnimationClip(e, r, i, !1);
		}
		return this.loopAnimationNameDict.set(e, i), !0;
	}
	changeMotion(e, t, n, r = 0, i = 0) {
		let a = `${t}/${n}`, o = this.playableAnimator;
		if (!o.existsAnimation(a)) {
			let r = this.load(t, n);
			if (!r) return 1;
			o.registerAnimationClip(e, r, a, !1);
		}
		return o.changeAnimation(e, a, r, Eo.FollowAnimationClip, i, !0).update(this.deltaTime), this.currentMotionAssetBundleNameDict.set(e, t), 0;
	}
	getCurrentMotionBundleName(e) {
		return this.currentMotionAssetBundleNameDict.get(e) ?? "";
	}
	getCurrentMotionName(e) {
		return this.playableAnimator.getCurrentAnimationName(e);
	}
	onFinishMotion(e, t, n) {
		let r = this.playableAnimator;
		if (r.getCurrentAnimationClip(e).isLooping) return;
		let i = this.loopAnimationNameDict.get(e);
		i && r.existsAnimation(i) && r.changeAnimation(e, i, 2, Eo.FollowAnimationClip, 0, !0).update(this.deltaTime);
	}
	setLipSync(e) {
		this.analyzer = e;
	}
	update(e) {
		this.deltaTime = e, this.playableAnimator?.update(e);
	}
	evaluateAnimator(e) {
		this.playableAnimator?.graph.update(e);
	}
	lateUpdate() {
		this.updateLipSync();
	}
	updateLipSync() {
		let e = this.analyzer ? this.analyzer() : null, t = e !== null && e > .3 ? 0 : e !== null && e > .24 ? 3 : e !== null && e > .17 ? 1 : e !== null && e > .1 ? 2 : 4;
		this.playableAnimator.changeAnimation(4, this.lipsyncMotionDict.get(t).name, .1, Eo.FollowAnimationClip, 0, !0).update(this.deltaTime);
	}
};
//#endregion
//#region src/engine/costumeShopMotion.ts
function qo(e, t = []) {
	let n = [];
	for (let t of e.children) {
		let e = t;
		e.isMesh && t.userData.pjskNativeUnityMesh && e.morphTargetDictionary && n.push(e);
	}
	for (let r of t) r.source === e && r.target.traverse((e) => {
		e.isMesh && e.morphTargetDictionary && n.push(e);
	});
	return n;
}
var Jo = class {
	provider;
	controller = null;
	clips = /* @__PURE__ */ new Map();
	prevCharacter = null;
	calmDownPending = !1;
	constructor(e) {
		this.provider = e;
	}
	resolve = (e, t) => this.clips.get(e)?.get(t) ?? null;
	async preload(e) {
		let t = [Go, ...e].filter((e) => !this.clips.has(e));
		if (!t.length) return;
		let n = await this.provider.clips(t);
		for (let e of t) {
			let t = n[e];
			this.clips.set(e, new Map((t ?? []).map((e) => [e.name, e])));
		}
	}
	async loadMotion(e, t, n) {
		let r = await this.provider.model3DMotionBundleName(e, t, n);
		return await this.preload([r]), r;
	}
	setupModel(e, t) {
		let n = new Mo(e, t);
		this.controller ??= new Ko(this.resolve), this.controller.setup(n);
	}
	playMotion(e, t) {
		let n = this.controller;
		if (!n) return;
		let r = this.prevCharacter !== e;
		this.prevCharacter = e, !(!r && n.getCurrentMotionBundleName($.MOTION) === t) && (n.changeMotionWithLoop($.FACIAL, t, "face", "face_loop", 0, 0), n.changeMotionWithLoop($.MOTION, t, "motion", "motion_loop", 0, 0), this.calmDownPending = !0);
	}
	takeCalmDown() {
		let e = this.calmDownPending;
		return this.calmDownPending = !1, e;
	}
	get active() {
		return this.controller !== null;
	}
	update(e) {
		this.controller?.update(e);
	}
	evaluate(e) {
		this.controller?.evaluateAnimator(e);
	}
	lateUpdate() {
		this.controller?.lateUpdate();
	}
	seek(e, t) {
		let n = this.controller, r = n?.animator;
		if (!n || !r) return 0;
		let i = n.getCurrentMotionBundleName($.MOTION);
		for (let [a, o] of [[$.FACIAL, e ? "face_loop" : "face"], [$.MOTION, e ? "motion_loop" : "motion"]]) n.changeMotion(a, i, o, 0, 0), r.setAnimationNormalizeTime(a, t);
		return n.evaluateAnimator(0), r.blender($.MOTION).currentAnimationClip ? this.snapshot().motionLength : 0;
	}
	snapshot() {
		let e = this.controller?.animator;
		if (!e) return {
			motionBundle: null,
			motionClip: null,
			motionTime: 0,
			motionLength: 0,
			facialClip: null,
			facialTime: 0,
			lipSyncClip: null
		};
		let t = e.blender($.MOTION), n = e.blender($.FACIAL), r = t.currentAnimationClip;
		return {
			motionBundle: this.controller.getCurrentMotionBundleName($.MOTION) || null,
			motionClip: r?.name ?? null,
			motionTime: t.currentTime,
			motionLength: r ? r.stopTime - r.startTime : 0,
			facialClip: n.currentAnimationClip?.name ?? null,
			facialTime: n.currentTime,
			lipSyncClip: e.getCurrentAnimationName($.LIPSYNC) || null
		};
	}
}, Yo = 60, Xo = new y.Vector3(0, 1, 0), Zo = new y.Vector3(0, 0, 0), Qo = {
	default: "#ffffff",
	shadow1: "#ffffff",
	shadow2: "#ffffff"
}, $o = new y.Quaternion(0, 1, 0, 0);
function es(e) {
	let t = null;
	return e.traverse((e) => {
		let n = e;
		!t && n.isSkinnedMesh && n.userData.pjskNativeUnityMesh && (t = n.userData.pjskUnityRootBone ?? null);
	}), t ? t.getObjectByName("Head") ?? null : null;
}
function ts(e) {
	return e && typeof e == "object" ? e : {};
}
function ns(e, t) {
	let n = (n) => (Array.isArray(e[n]) ? e[n] : []).filter((e) => e.partKind === t), r = (e) => n("colliders").filter((t) => t.scriptName === e).length;
	return {
		managers: n("managers").length,
		bones: n("bones").length,
		extraBones: n("extraBones").length,
		sphereColliders: r("SpringSphereCollider"),
		capsuleColliders: r("SpringCapsuleCollider"),
		panelColliders: r("SpringPanelCollider")
	};
}
function rs(e, t) {
	let n = ts(e), r = ts(ts(n.pjskSpringBone).runtimeUnitySetup), i = ts(n.characterControllers), a = ns(r, "Body"), o = ns(r, "Head");
	return {
		present: r.version === "0414",
		runtimePresent: !!t,
		active: !!t?.enabled,
		bodyManagerCount: a.managers,
		bodySpringBoneCount: a.bones,
		bodyExtraBoneCount: a.extraBones,
		bodySphereColliderCount: a.sphereColliders,
		bodyCapsuleColliderCount: a.capsuleColliders,
		bodyPanelColliderCount: a.panelColliders,
		headManagerCount: o.managers,
		headSpringBoneCount: o.bones,
		headExtraBoneCount: o.extraBones,
		headSphereColliderCount: o.sphereColliders,
		headCapsuleColliderCount: o.capsuleColliders,
		headPanelColliderCount: o.panelColliders,
		characterHairPresent: !!i.hair,
		characterEyePresent: !!i.eye,
		utjRuntime: t
	};
}
function is(e, t, n = /* @__PURE__ */ new Set()) {
	if (!(!e || typeof e != "object" || n.has(e))) {
		if (n.add(e), e instanceof y.Texture) {
			t.add(e);
			return;
		}
		if (!(e instanceof y.Color || e instanceof y.Vector2 || e instanceof y.Vector3 || e instanceof y.Vector4 || e instanceof y.Matrix3 || e instanceof y.Matrix4 || ArrayBuffer.isView(e) || e instanceof ArrayBuffer)) {
			if (Array.isArray(e)) {
				for (let r of e) is(r, t, n);
				return;
			}
			for (let r of Object.values(e)) is(r, t, n);
		}
	}
}
function as(e, t = !0, n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set()) {
	let i = Array.isArray(e) ? e : [e];
	for (let e of i) if (!n.has(e)) {
		if (t) {
			let t = /* @__PURE__ */ new Set();
			is(e, t);
			for (let e of t) r.has(e) || (e.dispose(), r.add(e));
		}
		e.dispose();
	}
}
function os(e, t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set()) {
	let r = /* @__PURE__ */ new Set();
	e.traverse((e) => {
		let i = e;
		i.isMesh && (i.geometry && !i.userData.pjskOutlineShell && !r.has(i.geometry) && (i.geometry.dispose(), r.add(i.geometry)), i.material && as(i.material, !0, t, n));
	});
}
function ss(e) {
	let t = ts(ts(ts(ts(e).pjskSpringBone).runtimeUnitySetup).funit), n = (e) => Math.max(Math.trunc(Number(t[e]) || 0), 0);
	return {
		present: !!t.present,
		scriptCount: n("scriptCount"),
		springManagerCount: n("springManagerCount"),
		springBoneCount: n("springBoneCount"),
		sphereColliderCount: n("sphereColliderCount"),
		capsuleColliderCount: n("capsuleColliderCount"),
		panelColliderCount: n("panelColliderCount"),
		detectedScripts: Array.isArray(t.detectedScripts) ? t.detectedScripts.filter((e) => typeof e == "string") : [],
		policy: typeof t.policy == "string" ? t.policy : "metadata_only; do not merge with UTJ/Sekai SpringBone runtime"
	};
}
function cs(e, t) {
	for (let n of t) {
		let t = e.get(n);
		if (t) return {
			node: t,
			path: n
		};
	}
	return null;
}
function ls(e) {
	let [t, ...n] = e.split(":"), r = Number(t);
	if (!Number.isInteger(r) || r <= 0) throw Error(`Invalid roleId ${e}: expected "<characterId>:<unit>".`);
	return {
		characterId: r,
		unit: n.length > 0 && n.join(":").trim() || null
	};
}
function us() {
	let e = /* @__PURE__ */ Error("Custom part selection was superseded by a newer request.");
	return e.name = "AbortError", e;
}
var ds = class {
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
	textureLoader;
	characterRoot;
	bodySlot;
	headSlot;
	sceneReference = new y.Group();
	capturePresentationEnabled = null;
	backgroundMode = "transparent";
	archiveBackground = null;
	archiveBackgroundBaseUrl = null;
	originalProvider = null;
	viewportWidth = 0;
	viewportHeight = 0;
	viewportPixelRatio = 0;
	animationFrame = 0;
	importRevision = 0;
	customSelectionQueue = Promise.resolve();
	customSelectionGeneration = 0;
	currentCompositionStatus = {
		mode: "pending",
		missingBodyBones: [],
		missingHeadBones: []
	};
	currentBodyAnimationRoot = null;
	costumeShopMotion = null;
	costumeShopMotionPaused = !1;
	costumeShopMotionRoleId = null;
	costumeShopMotionType = "costume";
	onCostumeShopAnimatorEvaluated = null;
	costumeShopMotionSpeed = 1;
	currentRuntimeExtension = null;
	currentSpringRuntime = null;
	currentExtraBoneRuntime = null;
	currentConstraintRuntime = null;
	currentSpringTimelineControl = null;
	currentPrefabSourceGraph = null;
	studioLights = new xr();
	officialCharacter = null;
	officialUpdatePending = !0;
	officialUpdateDone = !1;
	partDisplay = "all";
	currentModelKind = "none";
	currentHeadOptionalAssetId = null;
	headOptionalStage = new qr();
	headOptionalStageDirty = !0;
	cameraClipBeforePartDisplay = null;
	springRuntimeMode = "unity-prefab";
	masterCharacterHeightMeters = 1.6;
	characterModelScaleMeters = 1.6;
	tempVector = new y.Vector3();
	tempVectorB = new y.Vector3();
	tempQuaternion = new y.Quaternion();
	currentCameraPreset = "studio";
	studioLayout = "archive";
	currentCameraProfile = null;
	cameraRootYawDegrees = 0;
	viewFraming = {
		zoom: 1,
		heightOffset: 0
	};
	studioCamera = new nn();
	characterViewer = new jr(this.studioCamera);
	studioRenderTexture = null;
	viewerComposite = null;
	viewerCompositeTexture = null;
	studioSupersampler = null;
	studioOutputSide = null;
	captureOutput = null;
	detachViewerInput = null;
	drawingBufferSize = new y.Vector2();
	cameraDebugChangeCallback = null;
	currentLoadedRuntimePackage = null;
	lastNativeMeshInstallDiagnostics = null;
	lastConstraintSetupDiagnostics = null;
	runtimeDebug = {
		materialBindingMode: "manifest",
		funit: ss(null)
	};
	constructor(e, t) {
		let n = e instanceof HTMLElement ? {
			container: e,
			initialLight: t
		} : e;
		if (!n.container && !n.canvas) throw Error("Haruki 3D engine requires a container or canvas.");
		this.container = n.container ?? null, this.ownsCanvas = n.canvas === void 0, this.autoRender = n.autoRender ?? !0, this.manageResize = n.manageResize ?? n.canvas === void 0, this.scene = new y.Scene(), this.scene.fog = new y.Fog("#7f8d95", 5.5, 15);
		let r = n.canvas ?? n.container, i = this.ownsCanvas ? 320 : 1, a = Math.max(r.clientWidth, i), o = Math.max(r.clientHeight, i), s = dn("full-body", 0, this.masterCharacterHeightMeters);
		this.camera = new y.PerspectiveCamera(s.fov, a / o, .1, 100), this.camera.position.copy(s.position), this.renderer = new y.WebGLRenderer({
			antialias: !1,
			stencil: !0,
			canvas: n.canvas,
			alpha: !0,
			premultipliedAlpha: !0
		}), this.renderer.setClearColor(0, 0), this.renderer.autoClearStencil = !0, this.backgroundMode = n.background ?? "transparent";
		let c = ha(a, o, window.devicePixelRatio);
		this.renderer.setPixelRatio(c), this.renderer.setSize(a, o, this.ownsCanvas), this.viewportWidth = a, this.viewportHeight = o, this.viewportPixelRatio = c, this.renderer.outputColorSpace = y.SRGBColorSpace, this.container && this.renderer.domElement.parentElement !== this.container && this.container.appendChild(this.renderer.domElement), this.cameraTarget.copy(s.target), n.controlsFactory ? (this.controls = n.controlsFactory({
			camera: this.camera,
			canvas: this.renderer.domElement,
			target: this.cameraTarget,
			onChange: (e) => {
				this.cameraTarget.copy(e), this.cameraDebugChangeCallback?.();
			}
		}), this.controls.update()) : (this.controls = null, this.camera.lookAt(this.cameraTarget)), this.textureLoader = new fa(this.renderer, n.ktx2TranscoderPath), this.characterRoot = new y.Group(), this.bodySlot = new y.Group(), this.headSlot = new y.Group(), this.characterRoot.add(this.bodySlot), this.characterRoot.add(this.headSlot), this.scene.add(this.characterRoot), this.scene.add(this.headOptionalStage.group), this.setPresentationMode(n.presentationMode ?? "interactive"), this.studioCamera.initialize(j), this.applyCameraPreset(n.cameraPreset ?? "studio", n.cameraProfile, n.studioLayout), this.handleResize = this.handleResize.bind(this), this.manageResize && (window.addEventListener("resize", this.handleResize), this.handleResize()), this.autoRender && this.render();
	}
	async importCombinedCharacter(e, t = {}) {
		let n = ++this.importRevision;
		t.disposeBeforeLoad && this.releaseCurrentCharacterResources(), this.lastNativeMeshInstallDiagnostics = null, this.lastConstraintSetupDiagnostics = null, this.applyCostumeShopCharacterHeight(e.characterHeightMeters);
		let r = this.costumeShopMotionForCurrentStore(), [i, a] = await Promise.all([this.loadCombinedCharacterAsset(e), this.loadCostumeShopMotion(r)]);
		if (n !== this.importRevision) {
			i.official.renderer.dispose();
			return;
		}
		this.retireCharacterSlot(this.bodySlot), this.retireCharacterSlot(this.headSlot), this.resetSlotParents(), this.officialCharacter && this.retiredOfficialCharacters.push(this.officialCharacter), this.officialCharacter = i.official ?? null, this.officialUpdatePending = !0, this.currentModelKind = "character", this.currentHeadOptionalAssetId = null, this.partDisplay === "all" && this.restoreCameraAfterHeadOptionalStage(), this.currentRuntimeExtension = e.runtimeExtension, this.currentSpringRuntime = null, this.currentExtraBoneRuntime = null, this.currentConstraintRuntime = null, this.currentBodyAnimationRoot = null, this.currentPrefabSourceGraph = null, this.bodySlot.add(i.root), this.currentPrefabSourceGraph = i.prefabSourceGraph, h(i.prefabSourceGraph, this.characterModelScaleMeters), i.prefabSourceGraph.root !== i.root && this.bodySlot.add(i.prefabSourceGraph.root), this.currentBodyAnimationRoot = i.prefabSourceGraph.root, this.prepareCombinedComposition(), this.currentConstraintRuntime = c(i.prefabSourceGraph, this.currentRuntimeExtension, this.characterModelScaleMeters), this.syncUnityPrefabSourceGraph(), this.currentExtraBoneRuntime = Nt.fromPjskRuntimeExtension(this.currentRuntimeExtension, i.prefabSourceGraph.root), this.currentSpringRuntime = this.createSpringRuntime(i.prefabSourceGraph.root), r.setupModel(this.costumeShopAnimatorRoot(i.prefabSourceGraph), (e) => this.costumeShopRenderedMeshes(i.prefabSourceGraph, e)), r.playMotion(this.currentLoadedRuntimePackage?.wardrobe?.getActiveRoleId() ?? e.id, a), this.officialCharacter && (this.updateOfficialFrame(this.officialCharacter), this.officialCharacter.renderer.prepare(this.camera), this.officialUpdateDone = !0);
		let o = this.renderer.compileAsync(this.scene, this.camera);
		this.headOptionalStageDirty = !0, this.applyPartDisplayFilter(), await o, this.disposeRetiredCharacters();
	}
	setCharacterYawDegrees(e) {
		let t = y.MathUtils.degToRad(Number.isFinite(e) ? e : 0);
		this.characterRoot.rotation.y = t, this.characterRoot.updateMatrixWorld(!0), this.syncOfficialModelCombineSetup(), this.characterRoot.updateMatrixWorld(!0), this.resetCurrentSpringRuntimeState();
	}
	setViewYawDegrees(e) {
		if (this.cameraRootYawDegrees = Number.isFinite(e) ? e : 0, this.usesStudioCamera()) {
			this.studioCamera.cameraRootRotation = [...or(0, -this.cameraRootYawDegrees, 0)], this.isArchiveViewer() && this.setStudioZoomFromFraming(), this.applyStudioCamera(), this.cameraDebugChangeCallback?.();
			return;
		}
		this.applyCameraPose(dn(this.currentCameraProfile ?? "full-body", 0, this.masterCharacterHeightMeters), this.cameraRootYawDegrees), this.camera.updateProjectionMatrix(), this.syncCameraTarget(), this.cameraDebugChangeCallback?.();
	}
	setViewZoom(e) {
		return this.setViewFraming({
			...this.viewFraming,
			zoom: e
		});
	}
	setViewHeightOffset(e) {
		return this.setViewFraming({
			...this.viewFraming,
			heightOffset: e
		});
	}
	viewHeightRange(e = this.viewFraming.zoom) {
		return this.isArchiveViewer() ? ln(e) : {
			min: -.5,
			max: .8
		};
	}
	getViewFraming() {
		return { ...this.viewFraming };
	}
	setViewFraming(e) {
		let t = y.MathUtils.clamp(Number.isFinite(e.zoom) ? e.zoom : 1, .5, 3), n = this.viewHeightRange(t);
		return this.viewFraming = {
			zoom: t,
			heightOffset: y.MathUtils.clamp(Number.isFinite(e.heightOffset) ? e.heightOffset : 0, n.min, n.max)
		}, this.setViewYawDegrees(this.cameraRootYawDegrees), this.getViewFraming();
	}
	applyCameraPose(e, t) {
		let n = y.MathUtils.degToRad(t), r = e.position.clone().sub(e.target).divideScalar(this.viewFraming.zoom), i = e.target.clone();
		i.y += this.viewFraming.heightOffset;
		let a = i.clone().add(r).applyAxisAngle(Xo, n);
		i.applyAxisAngle(Xo, n), this.setCameraTarget(i), this.camera.position.copy(a), this.camera.fov = e.fov;
	}
	faceCharacterTowardCamera() {
		this.characterRoot.updateMatrixWorld(!0);
		let e = this.currentBodyAnimationRoot ?? this.characterRoot;
		e.updateMatrixWorld(!0);
		let t = cs(s(e), [
			"body/Position",
			"body/Position/PositionOffset",
			"body/Position/PositionOffset/Hip",
			"body/Position/Hip",
			"face/Position"
		])?.node ?? e;
		if (t.updateMatrixWorld(!0), g(t, this.tempQuaternion), this.tempVector.set(0, 0, 1).applyQuaternion(this.tempQuaternion), this.tempVector.y = 0, this.tempVector.lengthSq() < 1e-6) {
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
		this.characterRoot.rotation.y += i - r, this.characterRoot.updateMatrixWorld(!0), this.syncOfficialModelCombineSetup(), this.characterRoot.updateMatrixWorld(!0), this.resetCurrentSpringRuntimeState();
	}
	getRuntimeDebugSnapshot() {
		return {
			...structuredClone(this.runtimeDebug),
			nativeMeshes: this.lastNativeMeshInstallDiagnostics,
			constraints: this.lastConstraintSetupDiagnostics,
			funit: ss(this.currentRuntimeExtension),
			camera: this.getCameraDebugSnapshot()
		};
	}
	getCameraDebugSnapshot() {
		let e = this.camera.position, t = this.controls?.target ?? this.cameraTarget, n = e.clone().sub(t), r = new y.Spherical().setFromVector3(n), i = this.currentCameraPreset === "capture" ? dn(this.currentCameraProfile ?? "full-body", this.cameraRootYawDegrees, this.masterCharacterHeightMeters) : null, a = this.usesStudioCamera() ? this.studioCameraState() : i?.costumeShopState ?? null;
		return {
			preset: this.currentCameraPreset,
			profile: this.currentCameraProfile,
			characterRootYawDegrees: Number(y.MathUtils.radToDeg(this.characterRoot.rotation.y).toFixed(3)),
			costumeShopState: a === null ? null : {
				cameraRootYawDegrees: Number(a.cameraRootYawDegrees.toFixed(3)),
				zoomValue: Number(a.zoomValue.toFixed(4)),
				zoomMoveValue: Number(a.zoomMoveValue.toFixed(4)),
				zoomRatio: Number(a.zoomRatio.toFixed(4)),
				localCameraPosition: {
					x: Number(a.localCameraPosition.x.toFixed(4)),
					y: Number(a.localCameraPosition.y.toFixed(4)),
					z: Number(a.localCameraPosition.z.toFixed(4))
				},
				localCameraRotationYDegrees: a.localCameraRotationYDegrees
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
		return rs(this.currentRuntimeExtension, this.currentSpringRuntime?.getSnapshot(this.isSpringRuntimeEnabled(), e) ?? null);
	}
	setUtjSpringBoneTraceFilters(e, t) {
		this.currentSpringRuntime?.setTraceBoneFilters(e, t);
	}
	getUtjSpringBoneTraceSnapshot() {
		return this.currentSpringRuntime?.getTraceSnapshot() ?? null;
	}
	getAnimationSnapshot() {
		let e = this.costumeShopMotion?.snapshot() ?? {
			motionBundle: null,
			motionClip: null,
			motionTime: 0,
			motionLength: 0,
			facialClip: null,
			facialTime: 0,
			lipSyncClip: null
		};
		return {
			...e,
			activeClipName: e.motionClip,
			currentTime: e.motionTime,
			duration: e.motionLength,
			paused: this.costumeShopMotionPaused,
			speed: this.costumeShopMotionSpeed
		};
	}
	setAnimationPaused(e) {
		this.costumeShopMotionPaused = e;
	}
	setAnimationSpeed(e) {
		this.costumeShopMotionSpeed = e;
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
		let t = d.fromPjskRuntimeExtension(this.currentRuntimeExtension, e);
		return t && this.currentSpringTimelineControl && t.setTimelineControl(this.currentSpringTimelineControl), t;
	}
	setSpringTimelineControl(e) {
		this.currentSpringTimelineControl = e ? { ...e } : null, this.currentSpringTimelineControl ? this.currentSpringRuntime?.setTimelineControl(this.currentSpringTimelineControl) : this.currentSpringRuntime?.clearTimelineControl();
	}
	seekAnimationPhase(e) {
		return this.prepareSpringRuntimeForAnimationSeek(), this.costumeShopMotion?.seek(!1, e), this.syncOfficialModelCombineSetup(), this.resetCurrentSpringRuntimeState(), this.getAnimationSnapshot();
	}
	seekAnimationLoopPhase(e) {
		return this.prepareSpringRuntimeForAnimationSeek(), this.costumeShopMotion?.seek(!0, e), this.syncOfficialModelCombineSetup(), this.resetCurrentSpringRuntimeState(), this.getAnimationSnapshot();
	}
	prepareSpringRuntimeForAnimationSeek() {
		this.currentSpringRuntime?.resetPose();
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
		let n = Math.max(0, e), r = this.costumeShopMotion, i = t && !this.costumeShopMotionPaused;
		if (r && i) {
			let e = n * this.costumeShopMotionSpeed;
			r.update(e), r.evaluate(e), this.onCostumeShopAnimatorEvaluated?.();
		}
		this.syncOfficialModelCombineSetup(), this.currentExtraBoneRuntime?.update(), this.isSpringRuntimeEnabled() ? (r?.takeCalmDown() && this.currentSpringRuntime?.settleCurrentPose(Yo, n), this.currentSpringRuntime?.update(n)) : this.currentSpringRuntime?.resetPose(), r && i && r.lateUpdate();
	}
	costumeShopMotionForCurrentStore() {
		let e = this.originalProvider;
		if (!e) throw Error("Original motion needs the loaded content.");
		return this.costumeShopMotion ??= new Jo(e), this.costumeShopMotion;
	}
	providerFor(e) {
		if (!e || typeof e.provideBundle != "function" || typeof e.provideMasterData != "function") throw Error("content (assetBundleInfo, provideBundle, provideMasterData) is required to load a render recipe.");
		return this.originalProvider?.content !== e && (this.originalProvider && (this.releaseCurrentCharacterResources(), this.currentLoadedRuntimePackage = null, this.costumeShopMotion = null), this.originalProvider = At(e)), this.originalProvider;
	}
	costumeShopAnimatorRoot(e) {
		let t = e.root.children.find((e) => e.name === "body");
		if (!t) throw Error("The composed character has no body prefab root.");
		return t;
	}
	costumeShopRenderedMeshes(e, t) {
		return qo(t, e.meshCarrierBindings);
	}
	loadCostumeShopMotion(e) {
		let t = this.costumeShopMotionRoleId ?? this.currentLoadedRuntimePackage?.wardrobe?.getActiveRoleId() ?? null;
		if (!t) throw Error("Original motion needs the loaded part store.");
		let n = ls(t);
		return e.loadMotion(n.characterId, n.unit, this.costumeShopMotionType);
	}
	async applyCostumeShopMotionRole(e) {
		let t = this.costumeShopMotion;
		if (!t?.active) return;
		let n = await this.loadCostumeShopMotion(t);
		t.playMotion(this.currentLoadedRuntimePackage?.wardrobe?.getActiveRoleId() ?? e.id, n);
	}
	getCostumeShopMotionSnapshot() {
		return this.costumeShopMotion?.snapshot() ?? null;
	}
	stepCaptureFrame(e, t) {
		this.isShopViewer() && (this.characterViewer.update(this.costumeShopViewerLayout(), this.officialCharacter !== null), this.applyStudioCamera()), this.officialCharacter && !this.officialUpdateDone && this.updateOfficialFrame(this.officialCharacter), this.officialUpdateDone = !1, this.stepCharacterDynamics(e, t), t && this.archiveBackground?.step(Math.max(0, e));
	}
	async setBackgroundMode(e, t) {
		if (this.backgroundMode = e, e !== "archive") return;
		let n = (t ?? this.originalProvider?.content)?.archiveBackgroundBaseUrl ?? null;
		if (!n) throw Error("The archive background needs content.archiveBackgroundBaseUrl.");
		if (this.archiveBackground && this.archiveBackgroundBaseUrl === n) return;
		let r = await Qn(new URL(n, globalThis.location?.href).toString());
		this.archiveBackground?.dispose(), this.archiveBackground = new $n(r), this.archiveBackgroundBaseUrl = n;
	}
	getBackgroundMode() {
		return this.backgroundMode;
	}
	drawsArchiveBackground() {
		return this.backgroundMode === "archive" && this.archiveBackground !== null;
	}
	getCharacterRoot() {
		return this.characterRoot;
	}
	getCanvas() {
		return this.renderer.domElement;
	}
	waitForPostProcessorReady() {
		return Promise.resolve();
	}
	setViewportSize(e, t) {
		let n = this.ownsCanvas ? 320 : 1, r = Math.max(Math.trunc(e) || 0, n), i = Math.max(Math.trunc(t) || 0, n), a = this.resolvePixelRatio(r, i);
		this.viewportWidth === r && this.viewportHeight === i && this.viewportPixelRatio === a || (this.usesStudioCamera() || (this.camera.aspect = r / i, this.camera.updateProjectionMatrix()), this.renderer.setPixelRatio(a), this.renderer.setSize(r, i, this.ownsCanvas), this.viewportWidth = r, this.viewportHeight = i, this.viewportPixelRatio = a);
	}
	setPartDisplay(e) {
		Br(e), e !== this.partDisplay && (this.partDisplay = e, this.headOptionalStageDirty = !0, e === "all" && this.currentModelKind !== "head_optional" && (this.reattachHeadOptional(), this.restoreCameraAfterHeadOptionalStage()), this.applyPartDisplayFilter());
	}
	getPartDisplay() {
		return this.partDisplay;
	}
	getHeadOptionalStageSnapshot() {
		let e = this.headOptionalStage.root;
		if (!e) return null;
		let t = Hr(e), n = Wr(t);
		return {
			meshes: t.map((e) => e.name),
			center: n ? {
				x: n.center.x,
				y: n.center.y,
				z: n.center.z
			} : null,
			radius: n?.radius ?? null,
			framedRadius: this.headOptionalStage.radius,
			cameraPosition: {
				x: this.camera.position.x,
				y: this.camera.position.y,
				z: this.camera.position.z
			}
		};
	}
	applyPartDisplayFilter() {
		this.officialCharacter?.renderer.setSourceFilter(this.partDisplay === "head_optional" ? (e) => Vr(e.mesh) : null);
	}
	restoreCameraAfterHeadOptionalStage() {
		let e = this.cameraClipBeforePartDisplay;
		e && (this.cameraClipBeforePartDisplay = null, this.camera.near = e.near, this.camera.far = e.far, this.applyCameraPreset(this.currentCameraPreset, this.currentCameraProfile ?? void 0));
	}
	reattachHeadOptional() {
		this.headOptionalStage.root && (this.headOptionalStage.reattach(), this.characterRoot.updateMatrixWorld(!0), this.resetCurrentSpringRuntimeState());
	}
	stageHeadOptional() {
		if (this.cameraClipBeforePartDisplay ??= {
			near: this.camera.near,
			far: this.camera.far
		}, this.headOptionalStageDirty && (this.headOptionalStageDirty = !1, this.headOptionalStage.detach(this.characterRoot) && this.resetCurrentSpringRuntimeState()), !this.headOptionalStage.root) return;
		let e = this.headOptionalStage.radius, t = Kr(Zo, e, this.usesStudioCamera() ? this.studioCameraState().cameraRootYawDegrees : this.cameraRootYawDegrees, this.camera.fov, this.camera.aspect, this.tempVectorB), n = this.viewFraming.heightOffset * (t.distance / this.characterViewDistance()), r = t.distance / this.viewFraming.zoom, i = new y.Vector3(0, n, 0).add(t.target);
		this.camera.position.copy(t.position).sub(t.target).divideScalar(this.viewFraming.zoom).add(i), this.camera.up.set(0, 1, 0), this.camera.lookAt(i), this.camera.near = Math.max(.001, (r - e * 2) * .5), this.camera.far = r + e * 4 + 1, this.camera.updateProjectionMatrix(), this.camera.updateMatrixWorld();
	}
	renderFrame() {
		if ((this.partDisplay === "head_optional" || this.currentModelKind === "head_optional") && this.stageHeadOptional(), this.officialCharacter && (this.officialUpdatePending && this.updateOfficialFrame(this.officialCharacter), this.prepareOfficialFrame(this.officialCharacter)), this.usesStudioCamera() && this.viewerComposite) {
			this.renderStudioViewer(this.viewerComposite, this.captureOutput);
			return;
		}
		if (this.drawsArchiveBackground()) {
			this.archiveBackground.render(this.renderer, this.costumeShopViewerLayout());
			let e = this.renderer.autoClear;
			this.renderer.autoClear = !1, this.renderer.clearDepth(), this.renderer.clearStencil(), this.renderer.render(this.scene, this.camera), this.renderer.autoClear = e;
			return;
		}
		this.renderer.render(this.scene, this.camera);
	}
	renderStudioViewer(e, t = null) {
		let n = t?.layout ?? this.viewerLayout(), r = this.isArchiveViewer() ? this.studioSupersampler : null;
		r && r.resize(n.modelTexture.height, t ? this.renderer.capabilities.maxTextureSize : void 0);
		let i = r?.studioTarget ?? this.studioRenderTexture;
		if (!i) return;
		let a = this.scene.background, o = this.renderer.getClearColor(new y.Color()), s = this.renderer.getClearAlpha();
		this.scene.background = null, this.renderer.setClearColor(0, 0), this.renderer.setRenderTarget(i), this.renderer.render(this.scene, this.camera), r?.downsample(this.renderer), this.renderer.setRenderTarget(null), this.renderer.setClearColor(o, s), this.scene.background = a;
		let c = t?.target ?? null;
		this.drawsArchiveBackground() ? (this.archiveBackground.render(this.renderer, n, n.modelTexture.x + n.modelTexture.width * .5, c), e.render(this.renderer, n, null, !1, c)) : e.render(this.renderer, n, a, !0, c), c && this.renderer.setRenderTarget(null);
	}
	async captureImage(e = {}) {
		let t = this.viewerComposite;
		if (!this.isArchiveViewer() || !t) throw Error("captureImage needs the studio archive viewer");
		let n = this.renderer.capabilities.maxTextureSize, r = Number.isFinite(e.height) ? Math.round(e.height) : 2048, i = y.MathUtils.clamp(r, 256, Math.min(4096, n)), a = this.renderer.getDrawingBufferSize(this.drawingBufferSize), o = Math.min(n, Math.max(1, Math.round(i * a.x / Math.max(1, a.y)))), s = new y.WebGLRenderTarget(o, i, {
			format: y.RGBAFormat,
			type: y.UnsignedByteType,
			depthBuffer: !0,
			stencilBuffer: !0,
			generateMipmaps: !1,
			colorSpace: y.NoColorSpace
		}), c = new Uint8Array(o * i * 4);
		try {
			let e = Ar(o, i);
			this.captureOutput = {
				target: s,
				layout: e
			}, this.studioOutputSide = e.modelTexture.height, this.renderFrame(), this.renderer.readRenderTargetPixels(s, 0, 0, o, i, c);
		} finally {
			this.captureOutput = null, this.studioOutputSide = null, s.dispose(), this.renderFrame();
		}
		return ps(fs(c, o, i), o, i);
	}
	costumeShopViewerLayout() {
		let e = this.renderer.getDrawingBufferSize(this.drawingBufferSize);
		return Or(e.x, e.y);
	}
	viewerLayout() {
		if (!this.isArchiveViewer()) return this.costumeShopViewerLayout();
		let e = this.renderer.getDrawingBufferSize(this.drawingBufferSize);
		return Ar(e.x, e.y);
	}
	setStudioZoomFromFraming() {
		let e = this.viewFraming.zoom, t = e >= 1 ? 0 : Math.min(1, 1 / e - 1), n = this.studioCamera;
		n.zoomValue = 0, n.zoom(t * j.zoomDuration, 1, !0);
	}
	usesStudioCamera() {
		return this.currentCameraPreset === "studio";
	}
	outlineWidthScale() {
		if (!this.isArchiveViewer()) return 1;
		let e = this.studioOutputSide ?? this.viewerLayout().modelTexture.height;
		return e > 0 && e < M.textureHeight ? M.textureHeight / e : 1;
	}
	isArchiveViewer() {
		return this.currentCameraPreset === "studio" && this.studioLayout === "archive";
	}
	isShopViewer() {
		return this.currentCameraPreset === "studio" && this.studioLayout === "costume-shop";
	}
	characterViewDistance() {
		if (this.usesStudioCamera()) return this.studioCamera.cameraLocalPosition[2];
		let e = dn(this.currentCameraProfile ?? "full-body", 0, this.masterCharacterHeightMeters);
		return e.position.distanceTo(e.target);
	}
	resolvePixelRatio(e, t) {
		return this.isArchiveViewer() ? Math.min(Math.max(window.devicePixelRatio || 1, 1), 3) : ha(e, t, window.devicePixelRatio);
	}
	applyPixelRatio() {
		let e = this.resolvePixelRatio(this.viewportWidth, this.viewportHeight);
		e !== this.viewportPixelRatio && (this.renderer.setPixelRatio(e), this.renderer.setSize(this.viewportWidth, this.viewportHeight, this.ownsCanvas), this.viewportPixelRatio = e);
	}
	applyStudioCamera() {
		let e = this.studioCamera, t = e.cameraWorldPosition(), n = e.cameraWorldRotation();
		if (this.camera.position.set(-t[0], t[1], t[2]), this.camera.quaternion.set(n[0], -n[1], -n[2], n[3]).multiply($o), this.camera.fov = e.fieldOfView, this.camera.aspect = M.textureWidth / M.textureHeight, this.camera.near = M.nearClipPlane, this.camera.far = M.farClipPlane, this.cameraTarget.set(0, e.cameraLocalPosition[1], 0), this.isArchiveViewer()) {
			let { zoom: e, heightOffset: t } = this.viewFraming, n = Math.max(1, e);
			this.camera.position.x /= n, this.camera.position.z /= n, this.camera.position.y += t, this.cameraTarget.y += t;
		}
		this.camera.updateProjectionMatrix(), this.camera.updateMatrixWorld();
	}
	studioCameraState() {
		let e = this.studioCamera, [t, n, r, i] = e.cameraRootRotation;
		return {
			cameraRootYawDegrees: -y.MathUtils.radToDeg(Math.atan2(2 * (i * n + t * r), 1 - 2 * (n * n + t * t))),
			zoomValue: e.zoomValue,
			zoomMoveValue: e.zoomMoveValue,
			zoomRatio: e.zoomDurationRatio,
			localCameraPosition: new y.Vector3(...e.cameraLocalPosition),
			localCameraRotationYDegrees: 180
		};
	}
	enterStudioViewer(e) {
		let t;
		e === "archive" ? (this.studioSupersampler ??= new Rr(), t = this.studioSupersampler.output.texture) : (this.studioRenderTexture ??= Yr(), t = this.studioRenderTexture.texture), this.viewerCompositeTexture !== t && (this.viewerComposite?.dispose(), this.viewerComposite = new Xr(t, e !== "archive"), this.viewerCompositeTexture = t), this.controls && (this.controls.enabled = !1), e === "costume-shop" ? this.detachViewerInput ||= this.attachViewerInput() : (this.detachViewerInput?.(), this.detachViewerInput = null);
	}
	leaveCostumeShopViewer() {
		this.detachViewerInput?.(), this.detachViewerInput = null, this.controls && (this.controls.enabled = !0), this.camera.near = .1, this.camera.far = 100;
		let e = this.renderer.getSize(this.drawingBufferSize);
		this.camera.aspect = e.x / e.y, this.camera.updateProjectionMatrix();
	}
	attachViewerInput() {
		let e = this.renderer.domElement;
		if (typeof e.addEventListener != "function") return null;
		let t = (t) => {
			let n = e.getBoundingClientRect(), r = this.renderer.getDrawingBufferSize(this.drawingBufferSize);
			return [(t.clientX - n.left) * r.x / n.width, (n.bottom - t.clientY) * r.y / n.height];
		}, n = (e) => e.pointerType !== "mouse" || e.button === 0, r = (r) => {
			n(r) && (e.setPointerCapture?.(r.pointerId), this.costumeShopViewerTouch("began", r.pointerId, ...t(r)));
		}, i = (e) => this.costumeShopViewerTouch("moved", e.pointerId, ...t(e)), a = (e) => {
			n(e) && this.costumeShopViewerTouch("ended", e.pointerId, ...t(e));
		}, o = (e) => this.costumeShopViewerTouch("ended", e.pointerId, ...t(e)), s = e.style.touchAction;
		return e.style.touchAction = "none", e.addEventListener("pointerdown", r), e.addEventListener("pointermove", i), e.addEventListener("pointerup", a), e.addEventListener("pointercancel", o), () => {
			e.removeEventListener("pointerdown", r), e.removeEventListener("pointermove", i), e.removeEventListener("pointerup", a), e.removeEventListener("pointercancel", o), e.style.touchAction = s;
		};
	}
	costumeShopViewerTouch(e, t, n, r) {
		e === "began" ? this.characterViewer.touchBegan(t, n, r) : e === "moved" ? this.characterViewer.touchMoved(t, n, r) : this.characterViewer.touchEnded(t, n, r);
	}
	getCostumeShopViewerSnapshot() {
		let e = this.studioCamera;
		return {
			zoomValue: e.zoomValue,
			zoomMoveValue: e.zoomMoveValue,
			zoomDurationRatio: e.zoomDurationRatio,
			cameraLocalPosition: [...e.cameraLocalPosition],
			cameraRootRotation: [...e.cameraRootRotation],
			viewer: this.characterViewer.snapshot,
			layout: this.viewerLayout()
		};
	}
	updateOfficialFrame(e) {
		this.officialUpdatePending = !1, this.studioLights.setCameraRoot(this.cameraRootRotation(), [
			0,
			0,
			0
		]), this.studioLights.update(), e.model.update(), e.eye?.update();
	}
	cameraRootRotation() {
		return this.usesStudioCamera() ? this.studioCamera.cameraRootRotation : or(0, -this.cameraRootYawDegrees, 0);
	}
	prepareOfficialFrame(e) {
		this.camera.updateMatrixWorld(), Hi(this.studioLights.globals, this.camera.fov, this.outlineWidthScale()), e.renderer.prepare(this.camera), this.officialUpdatePending = !0;
	}
	finishCaptureFrame() {
		this.renderer.getContext().finish();
	}
	stepRuntimeFrame(e, t = {}) {
		this.stepCaptureFrame(e, t.advanceAnimation ?? !0);
	}
	async loadRuntimePackage(e) {
		let t = this.currentLoadedRuntimePackage?.wardrobe?.getActiveRoleId() ?? null, n = e.roleId ?? null;
		t && n && t !== n && (this.releaseCurrentCharacterResources(), this.currentLoadedRuntimePackage = null);
		let r = await v(this.providerFor(e.content), e);
		return this.currentLoadedRuntimePackage = r, r.combinedCharacter && await this.importCombinedCharacter(r.combinedCharacter), r;
	}
	async loadRenderRecipe(e) {
		return u(e) ? this.enqueueCustomSelectionMutation((t) => this.loadHeadOptionalRecipeInternal(e, t)) : this.enqueueCustomSelectionMutation((t) => this.loadRenderRecipeInternal(e, t));
	}
	async loadHeadOptionalRecipeInternal(r, i) {
		let a = this.providerFor(r.content), s = e(r), c = ls(s.roleId), l = t(c.characterId, c.unit), u = this.currentLoadedRuntimePackage;
		(!u?.wardrobe || u.partSet?.contentId !== a.id || u.wardrobe.getActiveRoleId() !== l) && await this.loadRuntimePackage({
			content: r.content,
			roleId: l,
			deferDefaultSelection: !0
		});
		let d = this.currentLoadedRuntimePackage?.wardrobe, f = d?.getPartPackageSet();
		if (!d || !f) throw Error("No custom part package is loaded.");
		d.getActiveRoleId() !== l && d.selectRole(c.characterId, c.unit);
		let p = await o(a, f, n(f, {
			characterId: c.characterId,
			unit: c.unit,
			bodyCostume3dId: 0,
			headCostume3dId: 0,
			hairCostume3dId: 0,
			headOptionalCostume3dId: s.headOptionalCostume3dId
		}));
		if (!i()) throw us();
		let m = f.role && t(f.role.characterId, f.role.unit) === l ? f.role : null;
		if (!m) throw Error(`The part set has no role ${l}.`);
		let h = _({
			runtime: p,
			role: m
		});
		return (this.currentModelKind !== "head_optional" || this.currentHeadOptionalAssetId !== h.id) && await this.importHeadOptionalOnly(h), {
			recipe: s,
			headOptional: h
		};
	}
	async importHeadOptionalOnly(e) {
		let t = ++this.importRevision;
		this.lastNativeMeshInstallDiagnostics = null, this.lastConstraintSetupDiagnostics = null, this.applyCostumeShopCharacterHeight(e.characterHeightMeters);
		let n = f(e.runtimeExtension);
		if (!n) throw Error("The head accessory has no prefab graph.");
		let r = a(n, e.runtimeExtension);
		if (this.lastNativeMeshInstallDiagnostics = r, r.error) throw Error(r.error);
		n.root.scale.setScalar(this.characterModelScaleMeters), n.root.updateMatrixWorld(!0);
		let i = await zi({
			root: n.root,
			materialSlots: e.materialSlots,
			characterId: e.characterId,
			textureLoader: this.textureLoader,
			globals: this.studioLights.globals,
			directionalLight: this.studioLights.directional,
			headBone: () => null,
			transformByPathId: (e) => n.nodeByPathId.get(e) ?? null,
			runtimeExtension: e.runtimeExtension,
			skinColors: e.skinColors ?? Qo
		});
		if (t !== this.importRevision) {
			i.renderer.dispose();
			return;
		}
		this.retireCharacterSlot(this.bodySlot), this.retireCharacterSlot(this.headSlot), this.resetSlotParents(), this.officialCharacter && this.retiredOfficialCharacters.push(this.officialCharacter), this.officialCharacter = i, this.officialUpdatePending = !0, this.currentRuntimeExtension = e.runtimeExtension, this.currentSpringRuntime = null, this.currentExtraBoneRuntime = null, this.currentConstraintRuntime = null, this.currentBodyAnimationRoot = null, this.currentPrefabSourceGraph = null, this.costumeShopMotion = null, this.currentModelKind = "head_optional", this.currentHeadOptionalAssetId = e.id, this.bodySlot.add(n.root), this.headOptionalStageDirty = !0, this.updateOfficialFrame(i), i.renderer.prepare(this.camera), this.officialUpdateDone = !0;
		let o = this.renderer.compileAsync(this.scene, this.camera);
		this.applyPartDisplayFilter(), await o, this.disposeRetiredCharacters();
	}
	enqueueCustomSelectionMutation(e) {
		let t = ++this.customSelectionGeneration, n = () => t === this.customSelectionGeneration, r = () => {
			if (!n()) throw us();
			return e(n);
		}, i = this.customSelectionQueue.then(r, r);
		return this.customSelectionQueue = i.catch(() => void 0), i;
	}
	async applyCustomSelection(e, t = () => !0) {
		let n = this.currentLoadedRuntimePackage?.wardrobe;
		if (!n) throw Error("No custom part package is loaded.");
		let r = n.getCombinedCharacter()?.id ?? null, i = await n.setCustomSelection(e, t);
		if (!t()) throw us();
		return r !== null && r === i.id && this.currentModelKind === "character" || await this.importCombinedCharacter(i, { disposeBeforeLoad: !0 }), i;
	}
	async loadRenderRecipeInternal(e, n) {
		let r = this.providerFor(e.content), i = l(e), a = ls(i.roleId), o = t(a.characterId, a.unit), s = this.currentLoadedRuntimePackage, c = s?.wardrobe?.getActiveRoleId() ?? null;
		(!s?.wardrobe || s.partSet?.contentId !== r.id || c !== o) && await this.loadRuntimePackage({
			content: e.content,
			roleId: o,
			deferDefaultSelection: !0
		});
		let u = this.currentLoadedRuntimePackage?.wardrobe;
		if (!u) throw Error("No custom part package is loaded.");
		u.getActiveRoleId() !== o && u.selectRole(a.characterId, a.unit);
		let d = i.motionRoleId ? ls(i.motionRoleId) : null, f = d ? t(d.characterId, d.unit) : null, p = f !== this.costumeShopMotionRoleId || i.motionType !== this.costumeShopMotionType;
		this.costumeShopMotionRoleId = f, this.costumeShopMotionType = i.motionType;
		let m = {
			characterId: a.characterId,
			unit: a.unit,
			bodyCostume3dId: i.bodyCostume3dId,
			headCostume3dId: i.headCostume3dId,
			headPackagePath: i.headPackagePath,
			hairCostume3dId: i.hairCostume3dId,
			headOptionalCostume3dId: i.headOptionalCostume3dId
		}, h = this.currentModelKind === "character" ? u.getCombinedCharacter()?.id ?? null : null, g = await this.applyCustomSelection(m, n);
		return p && h === g.id && await this.applyCostumeShopMotionRole(g), {
			selection: m,
			combinedCharacter: g
		};
	}
	getSnapshots(e) {
		return {
			animation: this.getAnimationSnapshot(),
			springBone: this.getSpringBoneSnapshot(e),
			camera: this.getCameraDebugSnapshot(),
			runtimeDebug: this.getRuntimeDebugSnapshot(),
			utjSpringBoneTrace: this.getUtjSpringBoneTraceSnapshot()
		};
	}
	destroy() {
		cancelAnimationFrame(this.animationFrame), this.releaseCurrentCharacterResources(), this.officialCharacter && this.retiredOfficialCharacters.push(this.officialCharacter), this.officialCharacter = null, this.disposeRetiredCharacters(), this.manageResize && window.removeEventListener("resize", this.handleResize), this.controls?.dispose(), this.detachViewerInput?.(), this.viewerComposite?.dispose(), this.studioRenderTexture?.dispose(), this.studioSupersampler?.dispose(), this.textureLoader.dispose(), this.archiveBackground?.dispose(), this.originalProvider = null, this.renderer.dispose(), this.ownsCanvas && this.renderer.domElement.parentElement === this.container && this.renderer.domElement.remove();
	}
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
		let t = e || 1.6, n = ir(t), r = Math.abs(n - this.characterModelScaleMeters) >= 1e-4;
		this.masterCharacterHeightMeters = t, this.characterModelScaleMeters = n, this.characterRoot.scale.setScalar(1), this.currentPrefabSourceGraph && h(this.currentPrefabSourceGraph, n), !(!r || this.currentCameraPreset !== "capture" || this.currentCameraProfile !== "legacy-cloud") && (this.applyCameraPose(dn("legacy-cloud", 0, t), this.cameraRootYawDegrees), this.camera.updateProjectionMatrix(), this.syncCameraTarget());
	}
	applyCameraPreset(e, t = "full-body", n) {
		let r = cn(e);
		if (!r) throw Error(`unknown camera preset ${String(e)}`);
		let i = this.usesStudioCamera();
		if (this.currentCameraPreset = r.preset, this.studioLayout = n ?? r.layout, this.applyPixelRatio(), r.preset === "studio") {
			this.currentCameraProfile = null, this.enterStudioViewer(this.studioLayout), this.isArchiveViewer() && this.setStudioZoomFromFraming(), this.applyStudioCamera(), this.cameraDebugChangeCallback?.();
			return;
		}
		i && this.leaveCostumeShopViewer(), this.currentCameraProfile = t, this.applyCameraPose(dn(t, 0, this.masterCharacterHeightMeters), this.cameraRootYawDegrees), this.camera.updateProjectionMatrix(), this.syncCameraTarget(), this.cameraDebugChangeCallback?.();
	}
	shiftCameraRight(e = 1) {
		if (!Number.isFinite(e) || e === 0 || this.usesStudioCamera()) return;
		let t = this.controls?.target ?? this.cameraTarget, n = fn(this.camera.position, t, e, this.characterModelScaleMeters);
		this.setCameraTarget(n.target), this.camera.position.copy(n.position), this.syncCameraTarget(), this.cameraDebugChangeCallback?.();
	}
	resetSlotParents() {
		this.bodySlot.parent?.remove(this.bodySlot), this.headSlot.parent?.remove(this.headSlot), this.characterRoot.add(this.bodySlot), this.characterRoot.add(this.headSlot);
	}
	retiredCharacterObjects = [];
	retiredOfficialCharacters = [];
	retireCharacterSlot(e) {
		this.headOptionalStage.reattach(), this.headOptionalStageDirty = !0;
		for (let t of [...e.children]) e.remove(t), this.retiredCharacterObjects.push(t);
	}
	disposeRetiredCharacters() {
		let e = /* @__PURE__ */ new Set();
		for (let t of [this.bodySlot, this.headSlot]) t.traverse((t) => {
			let n = t.material;
			for (let t of Array.isArray(n) ? n : n ? [n] : []) is(t, e);
		});
		for (let e of this.retiredOfficialCharacters.splice(0)) e.renderer.dispose();
		for (let t of this.retiredCharacterObjects.splice(0)) os(t, /* @__PURE__ */ new Set(), new Set(e));
	}
	releaseCurrentCharacterResources() {
		this.currentSpringRuntime?.resetPose(), this.currentSpringRuntime = null, this.currentExtraBoneRuntime = null, this.currentConstraintRuntime = null, this.currentRuntimeExtension = null, this.currentBodyAnimationRoot = null, this.currentPrefabSourceGraph = null, this.retireCharacterSlot(this.bodySlot), this.retireCharacterSlot(this.headSlot), this.resetSlotParents(), this.renderer.renderLists.dispose(), this.renderer.info.reset();
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
		let t = p(e.runtimeExtension, null);
		if (!t) throw Error("Final runtime package must provide runtimeUnitySetup version 0414.");
		this.currentPrefabSourceGraph = t, this.syncUnityPrefabSourceGraph();
		let n = a(t, e.runtimeExtension);
		if (this.lastNativeMeshInstallDiagnostics = n, n.error) throw Error(`${n.error}${n.warnings.length ? ` ${n.warnings.slice(0, 3).join(" ")}` : ""}`);
		this.syncUnityPrefabSourceGraph();
		let r = await zi({
			root: t.root,
			materialSlots: e.materialSlots,
			characterId: e.characterId,
			textureLoader: this.textureLoader,
			globals: this.studioLights.globals,
			directionalLight: this.studioLights.directional,
			headBone: () => es(t.root),
			transformByPathId: (e) => t.nodeByPathId.get(e) ?? null,
			runtimeExtension: e.runtimeExtension,
			skinColors: e.skinColors ?? null
		});
		return {
			root: t.root,
			prefabSourceGraph: t,
			official: r
		};
	}
	handleResize() {
		let e = this.container ?? this.renderer.domElement, t = Math.max(e.clientWidth, 320), n = Math.max(e.clientHeight, 320);
		this.setViewportSize(t, n);
	}
	render() {
		let e = this.clock.getDelta(), t = this.clock.elapsedTime;
		this.stepRuntimeFrame(e, {
			advanceAnimation: !0,
			elapsedTime: t
		}), this.usesStudioCamera() || this.controls?.update(), this.renderFrame(), this.animationFrame = requestAnimationFrame(() => this.render());
	}
	syncUnityPrefabSourceGraph() {
		let e = this.currentPrefabSourceGraph;
		e && (this.lastConstraintSetupDiagnostics = m(e, this.currentRuntimeExtension, this.characterModelScaleMeters, this.currentConstraintRuntime));
	}
	syncOfficialModelCombineSetup() {
		this.syncUnityPrefabSourceGraph();
	}
};
function fs(e, t, n) {
	let r = new Uint8ClampedArray(new ArrayBuffer(e.length)), i = t * 4;
	for (let t = 0; t < n; t++) {
		let a = (n - 1 - t) * i, o = t * i;
		for (let t = 0; t < i; t += 4) {
			let n = e[a + t + 3], i = n > 0 && n < 255 ? 255 / n : 1;
			r[o + t] = e[a + t] * i, r[o + t + 1] = e[a + t + 1] * i, r[o + t + 2] = e[a + t + 2] * i, r[o + t + 3] = n;
		}
	}
	return r;
}
async function ps(e, t, n) {
	let r = new ImageData(e, t, n);
	if (typeof OffscreenCanvas < "u") {
		let e = new OffscreenCanvas(t, n);
		return e.getContext("2d").putImageData(r, 0, 0), e.convertToBlob({ type: "image/png" });
	}
	let i = document.createElement("canvas");
	return i.width = t, i.height = n, i.getContext("2d").putImageData(r, 0, 0), new Promise((e, t) => i.toBlob((n) => n ? e(n) : t(/* @__PURE__ */ Error("PNG encoding failed")), "image/png"));
}
//#endregion
//#region src/costume_shop/CostumeShopKernel.ts
function ms(e) {
	let t = e.content;
	if (!t || typeof t.provideBundle != "function" || typeof t.provideMasterData != "function") throw Error("content (assetBundleInfo, provideBundle, provideMasterData) is required to create the CostumeShop kernel.");
	let n = hs(new ds({
		canvas: e.canvas,
		initialLight: { ...e.initialLight ?? Oe },
		autoRender: !1,
		manageResize: !1,
		ktx2TranscoderPath: e.ktx2TranscoderPath,
		cameraPreset: "studio",
		studioLayout: "archive"
	}), t);
	return e.background && e.background !== "transparent" && n.setBackground(e.background).catch((e) => console.error("Haruki 3D background:", e)), n;
}
function hs(e, t) {
	let n = r(e, t), i = !1, a = !1;
	return {
		...n,
		setCharacterYawDegrees: n.setViewYawDegrees,
		play() {
			n.play(), i = !0;
		},
		pause() {
			n.pause(), i = !1;
		},
		setPartDisplay(t) {
			if (a) throw Error("Haruki 3D runtime has been destroyed.");
			if (Br(t), !e.setPartDisplay) throw Error("This runtime engine cannot change the part display.");
			e.setPartDisplay(t), i || e.renderFrame();
		},
		destroy() {
			return a = !0, i = !1, n.destroy();
		}
	};
}
var gs = ms, _s = hs, vs = [
	"gameCharacters",
	"gameCharacterUnits",
	"gameCharacterUnit3dMotions",
	"character3ds",
	"costume3ds",
	"costume3dModels",
	"costume3dModelNotAvailablePatterns",
	"costume3dModelDefaultHairs"
], ys = (e) => new URL(e.endsWith("/") ? e : `${e}/`, globalThis.location?.href);
async function bs(e) {
	let t = await fetch(e);
	if (!t.ok) throw Error(`${e}: HTTP ${t.status}`);
	return await t.json();
}
async function xs(e, t = {}) {
	let n = ys(e), r = await bs(new URL("current.json", n)), i = r.costumeCatalog || r.catalog;
	if (!i) throw Error(`${new URL("current.json", n)} names no catalog`);
	let a = ys(t.masterBaseUrl ?? new URL("master/", n).toString()), o = null;
	return {
		assetBundleInfo: new URL(i, n).toString(),
		provideBundle: (e) => new URL(`bundles/${e.bundleName.split("/").map(encodeURIComponent).join("/")}.bundle?h=${encodeURIComponent(e.hash || `crc${e.crc}-${e.fileSize}`)}`, n).toString(),
		provideMasterData: (e) => t.masterLayout === "characters" ? bs(new URL(`characters/${e}.json`, a)) : (o ??= Promise.all(vs.map((e) => bs(new URL(`${e}.json`, a)))).then((e) => ({
			version: r.dataVersion ?? r.assetVersion,
			...Object.fromEntries(vs.map((t, n) => [t, e[n]]))
		})), o.catch(() => {
			o = null;
		}), o),
		archiveBackgroundBaseUrl: ys(t.archiveBackgroundBaseUrl ?? n.toString()).toString()
	};
}
//#endregion
export { Ze as A, M as C, yt as D, At as E, we as F, Ce as I, Te as L, Ne as M, Oe as N, k as O, Ee as P, j as S, Nt as T, dn as _, _s as a, un as b, To as c, pa as d, Tr as f, ir as g, rr as h, gs as i, je as j, ft as k, ya as l, Or as m, ms as n, ds as o, jr as p, hs as r, fs as s, xs as t, ha as u, cn as v, nn as w, ln as x, fn as y };
