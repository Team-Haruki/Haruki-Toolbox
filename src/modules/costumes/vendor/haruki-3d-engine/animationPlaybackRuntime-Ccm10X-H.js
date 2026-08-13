import * as e from "three";
//#region src/base/browserCharacterRuntime.ts
var t = 1 / 60, n = 5;
function r(e, r) {
	let a = 0, o = !1, s = !1, c = Promise.resolve(), l = null, u = null, d = null, f = 0, p = 0, m = () => {
		if (s) throw Error("Haruki 3D runtime has been destroyed.");
	}, h = (t) => {
		m();
		let n = i(t);
		if (u?.key === n) return u.promise;
		let a = Promise.all([e.waitForPostProcessorReady?.() ?? Promise.resolve(), e.loadRenderRecipe({
			...t,
			baseUrl: r
		})]).then(() => void 0);
		return u = {
			key: n,
			promise: a
		}, c = a.then(() => void 0, () => void 0), a.catch(() => {
			u?.promise === a && (u = null);
		}), a;
	}, g = (r) => {
		if (!o || s) return;
		d === null && (d = r), f += Math.min(Math.max((r - d) / 1e3, 0), t * n), d = r;
		let i = 0;
		for (; f >= t && i < n;) p += t, e.stepRuntimeFrame(t, {
			advanceAnimation: !0,
			elapsedTime: p
		}), f -= t, i += 1;
		e.renderFrame(), a = requestAnimationFrame(g);
	};
	return {
		prepare: h,
		async load(t) {
			await h(t), !s && (e.stepRuntimeFrame(0, {
				advanceAnimation: !1,
				elapsedTime: p
			}), e.renderFrame());
		},
		play() {
			m(), !o && (o = !0, d = null, f = 0, a = requestAnimationFrame(g));
		},
		pause() {
			o && (o = !1, cancelAnimationFrame(a), a = 0, d = null, f = 0);
		},
		resize(t, n) {
			m(), e.setViewportSize(t, n), e.renderFrame();
		},
		setCharacterYawDegrees(t) {
			m(), e.setCharacterYawDegrees(t), o || e.renderFrame();
		},
		setViewYawDegrees(t) {
			m(), e.setViewYawDegrees(t), o || e.renderFrame();
		},
		destroy() {
			return l || (s = !0, u = null, o = !1, cancelAnimationFrame(a), a = 0, l = c.then(() => {
				e.destroy();
			}), l);
		}
	};
}
function i(e) {
	return [
		e.roleId,
		e.bodyCostume3dId,
		e.headCostume3dId,
		e.headPackagePath ?? "",
		e.hairCostume3dId,
		e.headOptionalCostume3dId ?? ""
	].join("\0");
}
//#endregion
//#region part-runtime-core.mjs
function a(e, t) {
	let { corePath: n, warnings: r, ...i } = e;
	return {
		...t,
		...i,
		warnings: [...t.warnings ?? [], ...r ?? []]
	};
}
//#endregion
//#region src/parts/runtimePartComposer.ts
var o = /* @__PURE__ */ new WeakMap();
function s(e) {
	let t = e.toLowerCase();
	if (t === "head_optional" || t === "accessory") return "head_optional";
	if (t === "body" || t === "head" || t === "hair") return t;
	throw Error(`Unsupported runtime part type: ${e}`);
}
function c(e) {
	let t = s(e.partType);
	return (t === "head" || t === "head_optional") && u(e.headCostume3dAssetbundleType) ? "head" : t === "head" && d(e.headCostume3dAssetbundleType) ? "head_optional" : t;
}
function l(e) {
	try {
		return c(e);
	} catch {
		return null;
	}
}
function u(e) {
	return (e ?? "").trim().toLowerCase() === "head_and_hair";
}
function d(e) {
	let t = (e ?? "").trim().toLowerCase();
	return t === "head_only" || t === "head_all" || t === "head_front" || t === "head_back";
}
function f(e, t) {
	return `${e}:${he(t)}`;
}
function p(e) {
	let t = e.roles.find((t) => b(e, t.characterId, t.unit ?? null, "body", t.bodyCostume3dId) && ee(e, t.characterId, t.unit ?? null, t.headCostume3dId) && b(e, t.characterId, t.unit ?? null, "hair", t.hairCostume3dId));
	if (t) {
		let n = t.bodyCostume3dId, r = t.headCostume3dId, i = t.hairCostume3dId;
		return {
			characterId: t.characterId,
			unit: t.unit ?? null,
			bodyCostume3dId: n,
			headCostume3dId: r,
			headPackagePath: le(e, t.characterId, t.unit ?? null, r),
			hairCostume3dId: i,
			headOptionalCostume3dId: null
		};
	}
	let n = v(e, "body");
	if (!n) return null;
	let r = y(e, n.characterId, n.unit ?? null);
	if (!r) return null;
	let { head: i, hair: a } = r;
	return {
		characterId: n.characterId,
		unit: n.unit ?? i.unit ?? a.unit ?? null,
		bodyCostume3dId: n.costume3dId,
		headCostume3dId: i.costume3dId,
		headPackagePath: i.packagePath,
		hairCostume3dId: a.costume3dId,
		headOptionalCostume3dId: null
	};
}
function m(e, t, n, r = {}) {
	return e.registry.filter((e) => e.characterId === t).filter((e) => r.unit === void 0 || C(e.unit, r.unit)).filter((e) => l(e) === n).filter(S).filter((t) => !r.loadedOnly || ue(t) || e.packages.has(t.packagePath)).sort((e, t) => e.costume3dId - t.costume3dId);
}
function h(e) {
	let { partSet: t, selection: n, activeRoleId: r, resolveUrl: i } = e, a = f(n.characterId, n.unit);
	if (r !== null && a !== r) throw Error(`Custom switching is limited to role ${r}. Reload/select another role before switching to ${a}.`);
	let o = te(t, n.characterId, n.unit, "body", n.bodyCostume3dId), s = te(t, n.characterId, n.unit, "hair", n.hairCostume3dId), l = x(t, n), u = {
		...n,
		headPackagePath: l.packagePath
	}, d = ne(t, u, l), p = d && c(d.part) === "head" ? d : s, m = c(l) === "head" ? _(t, n) : null, h = m ? t.packages.get(m.packagePath) ?? null : null, v = d && c(d.part) === "head_optional" ? d : null, y = re(t, n);
	se(o, "body"), p && se(p, "head"), de(n.characterId, n.unit, [
		o,
		p,
		v,
		y
	].filter(Boolean)), fe(t.compatibility, u, c(l));
	let b = [
		o,
		p,
		v,
		y
	].filter(Boolean), ee = Se(l), ie = Ce(b, ee), ae = t.roleRuntimes.get(a) ?? null, oe = t.roles.find((e) => f(e.characterId, e.unit) === a), ce = g(t, oe, o), le = ge(o, i);
	le.characterHeightMeters = ce, _e(le, ae);
	let S = ve(Ce([
		p,
		v,
		y
	].filter(Boolean), ee), u, i, h);
	S.characterHeightMeters = ce;
	let ue = Te(ie, le, S, ae);
	return {
		id: `custom-${[
			t.baseUrl,
			t.masterVersion ?? "unknown-master",
			a,
			`requested:${n.bodyCostume3dId}:${n.headCostume3dId}:${n.hairCostume3dId}:${n.headOptionalCostume3dId ?? "none"}`,
			`body:${o.packagePath ?? "unknown"}`,
			`head:${l.packagePath}`,
			`hair:${s.packagePath ?? "unknown"}`,
			`accessory:${y?.packagePath ?? v?.packagePath ?? "none"}`,
			`motion:${ae?.motionPackage?.sourcePath ?? "none"}`
		].map(encodeURIComponent).join("-")}`,
		displayName: `Custom ${a}`,
		meshUrl: "",
		unityRuntimeJsonUrl: `haruki-composed://role-${a}/unity-runtime.msgpack.br`,
		unityRuntimeJsonPath: "viewer-composed-part-runtime",
		bodyAsset: le,
		headAsset: S,
		skinColors: oe?.skinColors,
		runtimeExtension: ue
	};
}
function g(e, t, n) {
	if (!t) {
		let e = (O(n.manifest) ? n.manifest : null)?.characterHeightMeters;
		if (typeof e == "number" && Number.isFinite(e) && e > 0) return e;
		throw Error("Runtime role catalog entry is missing.");
	}
	if (typeof t.characterHeightMeters == "number" && Number.isFinite(t.characterHeightMeters) && t.characterHeightMeters > 0) return t.characterHeightMeters;
	let r = ce(e, t.characterId, t.unit, "body", t.bodyCostume3dId), i = r ? e.packages.get(r.packagePath) : null, a = (O(i?.manifest) ? i.manifest : null)?.characterHeightMeters;
	if (typeof a == "number" && Number.isFinite(a) && a > 0) return a;
	throw Error(`Runtime role ${f(t.characterId, t.unit)} is missing master characterHeightMeters.`);
}
function _(e, t) {
	let n = e.roles.find((e) => e.characterId === t.characterId && C(e.unit, t.unit));
	return n ? e.registry.find((e) => e.characterId === n.characterId && C(e.unit, n.unit) && e.costume3dId === n.hairCostume3dId && l(e) === "hair" && S(e)) ?? null : null;
}
function v(e, t, n, r) {
	return e.registry.find((i) => l(i) === t && (n === void 0 || i.characterId === n) && (r === void 0 || C(i.unit, r)) && i.status !== "missing" && e.packages.has(i.packagePath));
}
function y(e, t, n) {
	let r = [...m(e, t, "head", {
		unit: n,
		loadedOnly: !1
	}), ...m(e, t, "head_optional", {
		unit: n,
		loadedOnly: !1
	})], i = [...m(e, t, "head", {
		unit: n,
		loadedOnly: !0
	}), ...m(e, t, "head_optional", {
		unit: n,
		loadedOnly: !0
	}).filter((e) => !ue(e))], a = /* @__PURE__ */ new Map();
	for (let e of r) {
		let t = a.get(e.costume3dId) ?? /* @__PURE__ */ new Set();
		t.add(`${c(e)}|${e.packagePath}`), a.set(e.costume3dId, t);
	}
	let o = i.filter((e) => a.get(e.costume3dId)?.size === 1).sort((e, t) => e.costume3dId - t.costume3dId || e.packagePath.localeCompare(t.packagePath)), s = m(e, t, "hair", {
		unit: n,
		loadedOnly: !0
	});
	for (let r of o) for (let i of s) {
		let a = {
			characterId: t,
			unit: n,
			bodyCostume3dId: 0,
			headCostume3dId: r.costume3dId,
			hairCostume3dId: i.costume3dId,
			headOptionalCostume3dId: null
		};
		try {
			return fe(e.compatibility, a, c(r)), {
				head: r,
				hair: i
			};
		} catch {}
	}
	return null;
}
function b(e, t, n, r, i) {
	let a = ce(e, t, n, r, i);
	return !!(a && (ue(a) || e.packages.has(a.packagePath)));
}
function ee(e, t, n, r) {
	return b(e, t, n, "head", r) || b(e, t, n, "head_optional", r);
}
function te(e, t, n, r, i) {
	let a = ce(e, t, n, r, i);
	if (!a) throw Error(`Missing ${r} registry entry for role ${f(t, n)}, costume3dId ${i}.`);
	if (!e.packages.has(a.packagePath)) throw Error(`Missing loaded ${r} package for role ${f(t, n)}, ${ae(a)}.`);
	return oe(e.packages.get(a.packagePath), a);
}
function x(e, t) {
	let n = t.headPackagePath?.trim() || null, r = e.registry.filter((e) => e.characterId === t.characterId && C(e.unit, t.unit) && e.costume3dId === t.headCostume3dId && ["head", "head_optional"].includes(l(e) ?? "") && S(e) && (n === null || e.packagePath === n)).sort((e, t) => {
		let n = e.packagePath.localeCompare(t.packagePath);
		return n === 0 ? c(e).localeCompare(c(t)) : n;
	});
	if (r.length === 0) {
		let e = n ? `, packagePath ${n}` : "";
		throw Error(`Missing head registry entry for role ${f(t.characterId, t.unit)}, costume3dId ${t.headCostume3dId}${e}.`);
	}
	if (new Set(r.map((e) => `${c(e)}|${e.packagePath}`)).size > 1) {
		let e = r.map((e) => `${c(e)}:${e.packagePath}`).join(", ");
		throw Error(`Ambiguous head registry entry for role ${f(t.characterId, t.unit)}, costume3dId ${t.headCostume3dId}; specify headPackagePath. Candidates: ${e}.`);
	}
	return r[0];
}
function ne(e, t, n = x(e, t)) {
	if (ue(n)) return null;
	if (!e.packages.has(n.packagePath)) throw Error(`Missing loaded head package for role ${f(t.characterId, t.unit)}, ${ae(n)}.`);
	return oe(e.packages.get(n.packagePath), n);
}
function re(e, t) {
	let n = ie(e, t);
	if (!n || ue(n)) return null;
	if (!e.packages.has(n.packagePath)) throw Error(`Missing loaded head_optional package for role ${f(t.characterId, t.unit)}, ${ae(n)}.`);
	return oe(e.packages.get(n.packagePath), n);
}
function ie(e, t) {
	if (!t.headOptionalCostume3dId) return null;
	let n = e.registry.filter((e) => e.characterId === t.characterId && C(e.unit, t.unit) && e.costume3dId === t.headOptionalCostume3dId && l(e) === "head_optional" && S(e)).sort((e, t) => e.packagePath.localeCompare(t.packagePath));
	if (n.length === 0) throw Error(`Missing head_optional registry entry for role ${f(t.characterId, t.unit)}, costume3dId ${t.headOptionalCostume3dId}.`);
	let r = new Set(n.map((e) => e.packagePath));
	if (r.size > 1) throw Error(`Ambiguous head_optional registry entry for role ${f(t.characterId, t.unit)}, costume3dId ${t.headOptionalCostume3dId}; the legacy selector cannot identify one original source. Candidates: ${[...r].join(", ")}.`);
	return n[0];
}
function ae(e) {
	let t = [
		`costume3dId ${e.costume3dId}`,
		`partType ${c(e)}`,
		`packagePath ${e.packagePath}`
	];
	e.bundlePath && t.push(`bundlePath ${e.bundlePath}`), e.colorVariationBundlePath && t.push(`colorVariationBundlePath ${e.colorVariationBundlePath}`);
	let n = e.warnings?.[0];
	return n && t.push(`warning ${n}`), t.join(", ");
}
function oe(e, t) {
	let n = l(t) ?? e.part.partType, r = O(e.manifest) ? jt(e.manifest) : e.manifest;
	if (O(r) && (r.id = `${n}-${t.characterId}-${t.costume3dId}-${t.unit ?? "default"}`, r.displayName = t.name ?? w(r.displayName) ?? r.id, r.characterId = String(t.characterId).padStart(2, "0"), typeof r.characterHeightMeters != "number" || r.characterHeightMeters <= 0)) throw Error(`Part runtime ${t.packagePath} is missing characterHeightMeters.`);
	return {
		...e,
		packagePath: t.packagePath,
		part: {
			...e.part,
			costume3dId: t.costume3dId,
			partType: n,
			characterId: t.characterId,
			unit: t.unit,
			name: t.name ?? e.part.name,
			colorId: typeof t.colorId == "number" ? t.colorId : e.part.colorId,
			colorName: t.colorName ?? e.part.colorName,
			costume3dGroupId: typeof t.costume3dGroupId == "number" ? t.costume3dGroupId : e.part.costume3dGroupId,
			modelAssetbundleName: t.modelAssetbundleName ?? e.part.modelAssetbundleName,
			headCostume3dAssetbundleType: t.headCostume3dAssetbundleType ?? e.part.headCostume3dAssetbundleType
		},
		manifest: r,
		mount: {
			...e.mount ?? {},
			packagePath: t.packagePath,
			expectedSkeletonId: String(t.characterId).padStart(2, "0")
		}
	};
}
function se(e, t) {
	let n = O(e.manifest) ? e.manifest : {};
	if (!O(n.proxy ?? n.Proxy)) throw Error(`Part runtime package '${e.packagePath ?? e.part.costume3dId}' is missing manifest.proxy material metadata for ${t}; regenerate it with a current Haruki-3D-Exporter before capture.`);
}
function ce(e, t, n, r, i) {
	return e.registry.find((e) => e.characterId === t && C(e.unit, n) && e.costume3dId === i && l(e) === r && S(e));
}
function le(e, t, n, r) {
	let i = new Set(e.registry.filter((e) => e.characterId === t && C(e.unit, n) && e.costume3dId === r && ["head", "head_optional"].includes(l(e) ?? "") && S(e)).map((e) => e.packagePath));
	return i.size === 1 ? [...i][0] : null;
}
function S(e) {
	return e.status !== "missing";
}
function ue(e) {
	return e.status === "empty" && l(e) === "head_optional";
}
function de(e, t, n) {
	let r = n.find((n) => n.part.characterId !== e || !C(n.part.unit, t));
	if (r) throw Error(`Part ${r.part.partType}/${r.part.costume3dId} belongs to role ${f(r.part.characterId, r.part.unit)}, not ${f(e, t)}.`);
}
function fe(e, t, n) {
	if (!e || n === "head") return;
	let r = me(t.unit, t.headCostume3dId, t.hairCostume3dId);
	if (pe(e).has(r)) throw Error(`Head ${t.headCostume3dId} and hair ${t.hairCostume3dId} are not available together.`);
}
function pe(e) {
	if (!e) return /* @__PURE__ */ new Set();
	let t = o.get(e);
	if (t) return t;
	let n = new Set([...e.denied ?? [], ...(e.rules ?? []).filter((e) => e.state === "not_available")].map((e) => me(e.unit, e.headCostume3dId, e.hairCostume3dId)));
	return o.set(e, n), n;
}
function me(e, t, n) {
	return `${he(e)}|${t}|${n}`;
}
function he(e) {
	return e ?? "";
}
function C(e, t) {
	return he(e) === he(t);
}
function ge(e, t) {
	let n = jt(e.manifest);
	if (n.id ||= `body-${e.part.costume3dId}`, n.displayName ||= e.part.name ?? n.id, n.characterId = String(e.part.characterId).padStart(2, "0"), typeof n.characterHeightMeters != "number" || n.characterHeightMeters <= 0) throw Error(`Body part runtime ${e.packagePath} is missing characterHeightMeters.`);
	n.materialPipeline ??= "embedded", n.source ||= {
		bundleRoot: "",
		manifestUrl: "",
		meshUrl: ""
	}, n.neckAnchor = xe(n.neckAnchor, {
		x: 0,
		y: 1.75,
		z: .15
	}), n.skeleton ||= {}, n.skeleton.neckAttach ||= { fallbackPosition: {
		x: 0,
		y: 1.75,
		z: .15
	} }, n.skeleton.neckAttach.fallbackPosition = xe(n.skeleton.neckAttach.fallbackPosition, {
		x: 0,
		y: 1.75,
		z: .15
	}), n.proxy ||= {}, n.proxy = {
		bodyColor: n.proxy.bodyColor ?? "#f2d0c3",
		shadowColor: n.proxy.shadowColor ?? "#bf958a",
		bodyScale: n.proxy.bodyScale ?? 1,
		torsoLength: n.proxy.torsoLength ?? 2.2,
		shoulderWidth: n.proxy.shoulderWidth ?? 1.1
	}, n.bodyMaterials ||= [];
	let r = ye(e, t);
	return n.source = {
		...n.source,
		meshUrl: At(n.source?.meshUrl, r),
		skeletonUrl: D(n.source?.skeletonUrl, r),
		animationUrls: n.source?.animationUrls?.map((e) => At(e, r))
	}, n.bodyMaterials = Ot(n.bodyMaterials, [e], t), n;
}
function _e(e, t) {
	let n = t?.motionPackage?.unityMotionJson;
	n && (e.source = {
		...e.source,
		animationUrls: [n]
	});
}
function ve(e, t, n, r) {
	let i = e.find((e) => c(e.part) === "head") ?? e[0], a = jt(i.manifest);
	if (a.id = `head-${t.headCostume3dId}-source-${encodeURIComponent(t.headPackagePath ?? "auto")}-hair-${t.hairCostume3dId}`, a.displayName = `Head ${t.headCostume3dId} / Hair ${t.hairCostume3dId}`, a.characterId = String(t.characterId).padStart(2, "0"), typeof a.characterHeightMeters != "number" || a.characterHeightMeters <= 0) throw Error(`Head part runtime ${i.packagePath} is missing characterHeightMeters.`);
	a.materialPipeline ??= "embedded", a.source ||= {
		bundleRoot: "",
		manifestUrl: "",
		meshUrl: ""
	}, a.rawImportOffset = xe(a.rawImportOffset, {
		x: 0,
		y: 0,
		z: 0
	}), a.assembly ||= {}, a.assembly.attachOrigin ||= { fallbackPosition: {
		x: 0,
		y: 1.75,
		z: .15
	} }, a.assembly.attachOrigin.fallbackPosition = xe(a.assembly.attachOrigin.fallbackPosition, {
		x: 0,
		y: 1.75,
		z: .15
	}), a.proxy ||= {}, a.proxy = {
		faceColor: a.proxy.faceColor ?? "#fde2d9",
		faceShadeColor: a.proxy.faceShadeColor ?? "#f7cdbf",
		skinColorDefault: a.proxy.skinColorDefault ?? a.proxy.faceColor ?? "#fde2d9",
		skinColor1: a.proxy.skinColor1 ?? a.proxy.faceShadeColor ?? "#f7cdbf",
		skinColor2: a.proxy.skinColor2 ?? a.proxy.faceShadeColor ?? "#f7cdbf",
		hairColor: a.proxy.hairColor ?? "#7b5b4a",
		hairShadowColor: a.proxy.hairShadowColor ?? "#513d33",
		headRadius: a.proxy.headRadius ?? .74,
		faceDepth: a.proxy.faceDepth ?? .82,
		hairArc: a.proxy.hairArc ?? .98
	}, a.faceMaterials ||= [];
	let o = ye(i, n);
	return a.source = {
		...a.source,
		meshUrl: At(a.source?.meshUrl, o),
		skeletonUrl: D(a.source?.skeletonUrl, o),
		animationUrls: a.source?.animationUrls?.map((e) => At(e, o))
	}, a.faceMaterials = Dt(Ot(a.faceMaterials, e, n), r, n), a.morphChannelBindings = e.flatMap((e) => Array.isArray(e.morphChannelBindings) ? e.morphChannelBindings : []), a;
}
function ye(e, t) {
	let n = w(e.packagePath) || w(e.mount?.packagePath) || "";
	return (e) => t(be(n, e));
}
function be(e, t) {
	if (!t || /^[a-z][a-z0-9+.-]*:/i.test(t) || t.startsWith("/")) return t;
	let n = e.replace(/\/+$/, "");
	return !n || t.startsWith(`${n}/`) ? t : `${n}/${t.replace(/^\/+/, "")}`;
}
function xe(e, t) {
	return {
		x: typeof e?.x == "number" ? e.x : t.x,
		y: typeof e?.y == "number" ? e.y : t.y,
		z: typeof e?.z == "number" ? e.z : t.z
	};
}
function Se(e) {
	return c(e) === "head_optional" ? {
		kind: "resolved_head_optional_source",
		activePartTypes: /* @__PURE__ */ new Set([
			"body",
			"hair",
			"head_optional"
		])
	} : {
		kind: "resolved_complete_head_source",
		activePartTypes: /* @__PURE__ */ new Set([
			"body",
			"head",
			"head_optional"
		])
	};
}
function Ce(e, t) {
	return e.filter((e) => we(e, t));
}
function we(e, t) {
	return t.activePartTypes.has(c(e.part));
}
function w(e) {
	return typeof e == "string" ? e : "";
}
function Te(e, t, n, r) {
	let i = De(e);
	return {
		version: "0414",
		sourceKind: "viewer_composed_part_runtime_package",
		bodyAsset: t,
		headAsset: n,
		bodyManifest: t,
		headManifest: n,
		materialSlots: {
			body: t.bodyMaterials,
			head: n.faceMaterials,
			accessory: []
		},
		textureRoles: e.flatMap((e) => e.textureRoles ?? []),
		characterTextures: Object.assign({}, ...e.map((e) => e.characterTextures ?? {})),
		characterControllers: Ee(e),
		nativeMeshes: vt(e, i),
		motionPackage: r?.motionPackage ?? null,
		morphChannelBindings: n.morphChannelBindings ?? [],
		pjskSpringBone: {
			raw: i.raw,
			runtimeUnitySetup: i
		},
		warnings: [...i.warnings ?? [], ...r?.warnings ?? []]
	};
}
function Ee(e) {
	return e.find((e) => {
		let t = c(e.part);
		return t === "head" || t === "hair";
	})?.characterControllers ?? {};
}
function De(e) {
	let t = e.map((e, t) => He(e, t)), n = t[0]?.setup ?? {}, r = t.map((e) => e.prefabGraph).filter((e) => e !== null), i = e.flatMap((e) => [...e.warnings ?? [], ...e.springBone?.warnings ?? []]), a = Pt(t.flatMap((e) => e.activeRoots)), o = t.flatMap((e) => e.managers), s = t.flatMap((e) => e.bones), c = t.flatMap((e) => e.extraBones), l = t.flatMap((e) => e.colliders), u = t.flatMap((e) => e.constraints), d = it(t), f = Oe(i, d), p = lt(t, d), m = ct(s, d), h = Le(r);
	if (!h) throw Error("Composed parts do not provide the official model_combine_setup body/head paths.");
	let g = {
		...n,
		version: "0414",
		prefabGraphs: r,
		bodyHeadAssembly: h,
		rootSelectionProfile: {
			policy: "viewer_composed_active_parts",
			rootCandidates: []
		},
		setupPlan: {
			discoveryMode: "viewer_composed_part_runtime_package",
			rootPolicy: "active_custom_parts; manager ownership is rebuilt from composed hierarchy",
			orderedSteps: [
				"load active part packages",
				"merge part native meshes",
				"merge active part springbone records",
				"rebuild SpringManager ownership from composed hierarchy",
				"repair constraints after composition",
				"rebind colliderFlag springs to current body colliders",
				"reset spring runtime"
			],
			directBindingCount: d.filter((e) => e.sourceKind === "direct").length,
			colliderFlagBindingCount: d.filter((e) => e.sourceKind === "colliderFlag").length
		},
		activeRootProfile: {
			defaultBodyRoot: a[0] ?? "body",
			activeRoots: a.length ? a : ["body", "face"],
			inactiveRoots: []
		},
		funit: Fe(e),
		raw: Ie(t),
		managers: o,
		bones: s,
		extraBones: c,
		colliders: l,
		colliderBindings: d,
		bindingDecisions: m,
		constraintSetup: {
			version: "0414",
			sourceKind: "viewer_composed_part_runtime_package",
			constraints: u,
			warnings: Pt(t.flatMap((e) => Nt(e.setup.constraintSetup?.warnings)))
		},
		managerColliderCaches: p,
		warnings: f
	};
	return ke(t, g, bt(e)), g;
}
function Oe(e, t) {
	let n = t.filter((e) => e.sourceKind === "colliderFlag");
	return n.length > 0 && n.every((e) => A(e.colliders).length > 0) ? e.filter((e) => !/has colliderFlag .* but no body colliders matched runtime CL_\* prefixes/.test(e)) : e;
}
function ke(e, t, n) {
	for (let r of e.filter((e) => e.partType === "head_optional")) {
		let i = r.prefabGraph, a = Et(w(r.runtime.mount?.attachNode)), o = a ? Ae(e, a) : null, s = (i?.transforms ?? []).find((e) => e.parentPathId == null && w(e.transformPath) === "optional");
		if (!i || !o || !s || typeof o.pathId != "number" || typeof s.pathId != "number") {
			t.warnings?.push(`Head optional prefab '${w(r.runtime.part.modelAssetbundleName) || "<unknown>"}' was not instantiated: official prefab root 'optional' or active attach node '${a || "<missing>"}' was not found.`);
			continue;
		}
		let c = (i.monoBehaviours ?? []).find((e) => w(e.scriptName) === "CharacterAccessoryTransformController" && Me(w(e.transformPath), "optional"));
		if (c) {
			let e = w(c.transformPath), a = (i.transforms ?? []).find((t) => w(t.transformPath) === e);
			a ? (Ne(a, St(r.runtime, n)), i.headOptionalControllerPath = e) : t.warnings?.push(`Head optional controller target '${e || "<missing>"}' was not found in prefab 'optional'.`);
		} else s.localPosition = {
			X: 0,
			Y: 0,
			Z: 0
		}, s.localRotation = {
			x: 0,
			y: 0,
			z: 0,
			w: 1
		};
		je(i, "optional"), s.parentPathId = o.pathId, o.childPathIds = [.../* @__PURE__ */ new Set([...o.childPathIds ?? [], s.pathId])], i.headOptionalAttachPath = w(o.transformPath), i.headOptionalPrefabRootPath = "optional";
	}
}
function Ae(e, t) {
	for (let n of e) {
		if (n.partType === "head_optional" || !n.prefabGraph) continue;
		let e = n.prefabGraph.transforms ?? [], r = new Map(e.filter((e) => typeof e.pathId == "number").map((e) => [e.pathId, e])), i = new Map(k(n.prefabGraph.gameObjects).map((e) => [Tt(e.pathId, NaN), e.activeSelf !== !1 && e.activeInHierarchy !== !1])), a = (e) => typeof e.gameObjectPathId != "number" || i.get(e.gameObjectPathId) !== !1, o = (e) => {
			if (!a(e)) return null;
			if (w(e.name) === t || Et(w(e.transformPath)) === t) return e;
			for (let t of e.childPathIds ?? []) {
				let e = r.get(t), n = e ? o(e) : null;
				if (n) return n;
			}
			return null;
		};
		for (let t of n.activeRoots) {
			let n = e.find((e) => e.parentPathId == null && w(e.transformPath) === t), r = n ? o(n) : null;
			if (r) return r;
		}
	}
	return null;
}
function je(e, t) {
	let n = (e) => Me(w(e.transformPath), t);
	e.transforms = (e.transforms ?? []).filter(n), e.gameObjects = k(e.gameObjects).filter(n), e.renderers = k(e.renderers).filter(n), e.animators = k(e.animators).filter(n), e.monoBehaviours = (e.monoBehaviours ?? []).filter(n), e.constraints = k(e.constraints).filter(n), e.rootTransformPathIds = e.transforms.filter((e) => w(e.transformPath) === t).map((e) => e.pathId).filter((e) => typeof e == "number");
}
function Me(e, t) {
	return e === t || e.startsWith(`${t}/`);
}
function Ne(e, t) {
	let n = wt(t?.position, 0, 0, 0), r = wt(t?.rotationEulerDegrees, 0, 0, 0), i = wt(t?.scale, 1, 1, 1);
	e.localPosition = {
		X: n.x,
		Y: n.y,
		Z: n.z
	}, e.localRotation = Pe(r), e.localScale = {
		X: Math.abs(i.x),
		Y: Math.abs(i.y),
		Z: Math.abs(i.z)
	};
}
function Pe(e) {
	let t = e.x * Math.PI / 180, n = e.y * Math.PI / 180, r = e.z * Math.PI / 180, i = Math.cos(t / 2), a = Math.cos(n / 2), o = Math.cos(r / 2), s = Math.sin(t / 2), c = Math.sin(n / 2), l = Math.sin(r / 2);
	return {
		x: s * a * o - i * c * l,
		y: i * c * o + s * a * l,
		z: i * a * l + s * c * o,
		w: i * a * o - s * c * l
	};
}
function Fe(e) {
	let t = e.map((e) => Mt(e.springBone?.funit)).filter((e) => Object.keys(e).length > 0), n = (e, t) => typeof e[t] == "number" && Number.isFinite(e[t]) ? Math.max(Math.trunc(e[t]), 0) : 0, r = Pt(t.flatMap((e) => Nt(e.detectedScripts))).sort((e, t) => e.localeCompare(t));
	return {
		present: t.some((e) => e.present === !0),
		scriptCount: t.reduce((e, t) => e + n(t, "scriptCount"), 0),
		springManagerCount: t.reduce((e, t) => e + n(t, "springManagerCount"), 0),
		springBoneCount: t.reduce((e, t) => e + n(t, "springBoneCount"), 0),
		sphereColliderCount: t.reduce((e, t) => e + n(t, "sphereColliderCount"), 0),
		capsuleColliderCount: t.reduce((e, t) => e + n(t, "capsuleColliderCount"), 0),
		panelColliderCount: t.reduce((e, t) => e + n(t, "panelColliderCount"), 0),
		detectedScripts: r,
		policy: "metadata_only; do not merge with UTJ/Sekai SpringBone runtime"
	};
}
function Ie(e) {
	let t = e.filter((e) => e.partType === "body").flatMap((e) => e.extraBones), n = e.filter((e) => e.partType === "head" || e.partType === "hair" || e.partType === "head_optional").flatMap((e) => e.extraBones);
	return {
		body: { extraBones: t },
		head: { extraBones: n }
	};
}
function Le(e) {
	let t = Re(e), n = ze(e);
	return !t || !Be(e, "face") || !n ? null : {
		version: "0414",
		sourceKind: "viewer_composed_part_runtime_package",
		parentRootPath: "body",
		parentAttachPath: t,
		childRootPath: "face",
		childOriginPath: n,
		parentingMode: "model_combine_setup",
		coordinateSpace: "unity-left-handed",
		faceRendererName: "Face",
		combineNodeAName: "Neck",
		combineNodeBName: "Head",
		childMoveSuffix: "_target",
		parentCombineNodeAPath: t,
		parentCombineNodeBPath: `${t}/Head`,
		childCombineNodeAPath: n,
		childCombineNodeBPath: `${n}/Head`
	};
}
function Re(e) {
	return ["body/Position/PositionOffset/Hip/Waist/Spine/Chest/Neck", "body/Position/Hip/Waist/Spine/Chest/Neck"].find((t) => Be(e, t)) ?? null;
}
function ze(e) {
	return ["face/Position/Hip/Waist/Spine/Chest/Neck", "face/Position"].find((t) => Be(e, t)) ?? null;
}
function Be(e, t) {
	return e.some((e) => k(e?.transforms).some((e) => w(e.transformPath) === t));
}
function Ve(e) {
	let t = e.springBone ?? {};
	return {
		managers: t.managers,
		bones: t.bones,
		extraBones: t.extraBones,
		colliders: t.colliders,
		colliderBindings: t.colliderBindings,
		managerColliderCaches: t.managerColliderCaches,
		activeRootProfile: t.activeRootProfile,
		funit: t.funit,
		bindingDecisions: t.bindingDecisions,
		constraintSetup: t.constraintSetup
	};
}
function He(e, t) {
	let n = Ve(e), r = c(e.part), i = Ue(r, Nt(n.activeRootProfile?.activeRoots)), a = We(T(n.managers, t, r), i), o = We(T(n.bones, t, r), i), s = We(Ge(n.extraBones, t, r), i), l = We(T(n.colliders, t, r), i), u = qe(T(n.colliderBindings, t, r), o), d = Je(T(n.managerColliderCaches, t, r), a), f = Ye(n.constraintSetup, t, r, i);
	return Ze(a, o, d), {
		runtime: e,
		partIndex: t,
		partType: r,
		setup: n,
		prefabGraph: Xe(e.springBone?.prefabGraph, t),
		managers: a,
		bones: o,
		extraBones: s,
		colliders: l,
		colliderBindings: u,
		managerColliderCaches: d,
		constraints: f,
		activeRoots: i
	};
}
function Ue(e, t) {
	return e === "body" && t.includes("body") ? ["body"] : (e === "head" || e === "hair") && t.includes("face") ? ["face"] : e === "head_optional" && t.includes("optional") ? ["optional"] : t.length ? [t[0]] : [e === "body" ? "body" : "face"];
}
function We(e, t) {
	let n = new Set(t.map((e) => gt(e)));
	return e.filter((e) => {
		let t = gt(_t(e.nodePath) ?? e.poseRoot);
		return n.has(t);
	});
}
function Ge(e, t, n) {
	return T(e, t, n).map((e) => {
		let n = e, r = Ke(n.gameObject ?? n.GameObject, t), i = Ke(n.referenceBone ?? n.ReferenceBone, t);
		return n.gameObject = r, n.GameObject = r, n.referenceBone = i, n.ReferenceBone = i, n.nodePath = r?.transformPath ?? r?.TransformPath ?? null, n.poseRoot = _t(n.nodePath) ?? null, n;
	});
}
function Ke(e, t) {
	if (!O(e)) return e;
	let n = { ...e };
	return typeof n.pathId == "number" && (n.pathId = E(n.pathId, t)), typeof n.PathId == "number" && (n.PathId = E(n.PathId, t)), n;
}
function qe(e, t) {
	let n = new Set(t.map((e) => e.pathId).filter((e) => typeof e == "number"));
	return e.filter((e) => typeof e.sourceSpringBonePathId != "number" || n.has(e.sourceSpringBonePathId));
}
function Je(e, t) {
	let n = new Set(t.map((e) => e.pathId).filter((e) => typeof e == "number"));
	return e.filter((e) => typeof e.managerPathId != "number" || n.has(e.managerPathId));
}
function Ye(e, t, n, r) {
	let i = new Set(r.map((e) => gt(e)));
	return T(e?.constraints, t, n).map((e) => {
		let n = k(e.sources).map((e) => {
			let n = { ...e };
			return typeof n.sourcePathId == "number" && (n.sourcePathId = E(n.sourcePathId, t)), n;
		});
		return typeof e.worldUpObjectPathId == "number" && (e.worldUpObjectPathId = E(e.worldUpObjectPathId, t)), {
			...e,
			sources: n
		};
	}).filter((e) => {
		let t = gt(_t(e.ownerPath));
		return !t || i.has(t);
	});
}
function Xe(e, t) {
	if (!O(e)) return null;
	let n = { ...e };
	return n.runtimePartIndex = t, n.transforms = k(e.transforms).map((e) => {
		let n = {
			...e,
			runtimePartIndex: t
		};
		return typeof n.pathId == "number" && (n.pathId = E(n.pathId, t)), typeof n.PathId == "number" && (n.PathId = E(n.PathId, t)), typeof n.parentPathId == "number" && (n.parentPathId = E(n.parentPathId, t)), Array.isArray(n.childPathIds) && (n.childPathIds = n.childPathIds.map((e) => typeof e == "number" ? E(e, t) : e)), n;
	}), n.monoBehaviours = k(e.monoBehaviours).map((e) => {
		let n = {
			...e,
			runtimePartIndex: t
		};
		return typeof n.pathId == "number" && (n.pathId = E(n.pathId, t)), n;
	}), n;
}
function Ze(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = n.nodePath, i = t.filter((t) => Qe(t.nodePath, e)).map((e) => e.pathId).filter((e) => typeof e == "number");
		i.length && (n.bonePathIds = i, typeof n.pathId == "number" && r.set(n.pathId, i));
	}
	for (let e of n) {
		let t = typeof e.managerPathId == "number" ? r.get(e.managerPathId) : void 0;
		t?.length && (e.springBonePathIds = t);
	}
}
function Qe(e, t) {
	return !e || !t ? !1 : e === t || e.startsWith(`${t}/`);
}
function T(e, t, n) {
	return Array.isArray(e) ? e.map((e) => {
		if (!O(e)) return e;
		let r = { ...e };
		return r.runtimePartIndex = t, r.runtimePartType = n, typeof r.pathId == "number" && (r.pathId = E(r.pathId, t)), typeof r.index == "number" && (r.index = E(r.index, t)), typeof r.managerPathId == "number" && (r.managerPathId = E(r.managerPathId, t)), typeof r.pivotSourcePathId == "number" && (r.pivotSourcePathId = E(r.pivotSourcePathId, t)), typeof r.sourceSpringBonePathId == "number" && (r.sourceSpringBonePathId = E(r.sourceSpringBonePathId, t)), Array.isArray(r.bonePathIds) && (r.bonePathIds = r.bonePathIds.map((e) => typeof e == "number" ? E(e, t) : e)), Array.isArray(r.forceProviders) && (r.forceProviders = $e(r.forceProviders, t)), Array.isArray(r.directColliderPathIds) && (r.directColliderPathIds = r.directColliderPathIds.map((e) => typeof e == "number" ? E(e, t) : e)), Array.isArray(r.sourceColliderPathIds) && (r.sourceColliderPathIds = r.sourceColliderPathIds.map((e) => typeof e == "number" ? E(e, t) : e)), Array.isArray(r.colliders) && (r.colliders = r.colliders.map((e) => typeof e == "number" ? E(e, t) : e)), Array.isArray(r.selectedColliderIndexes) && (r.selectedColliderIndexes = r.selectedColliderIndexes.map((e) => typeof e == "number" ? E(e, t) : e)), Array.isArray(r.sphereColliderIndexes) && (r.sphereColliderIndexes = r.sphereColliderIndexes.map((e) => typeof e == "number" ? E(e, t) : e)), Array.isArray(r.capsuleColliderIndexes) && (r.capsuleColliderIndexes = r.capsuleColliderIndexes.map((e) => typeof e == "number" ? E(e, t) : e)), Array.isArray(r.panelColliderIndexes) && (r.panelColliderIndexes = r.panelColliderIndexes.map((e) => typeof e == "number" ? E(e, t) : e)), Array.isArray(r.springBonePathIds) && (r.springBonePathIds = r.springBonePathIds.map((e) => typeof e == "number" ? E(e, t) : e)), O(r.collidersByRoot) && (r.collidersByRoot = et(r.collidersByRoot, t)), O(r.candidateRoots) && (r.candidateRoots = et(r.candidateRoots, t)), r;
	}) : [];
}
function $e(e, t) {
	return e.map((e) => {
		if (!O(e)) return e;
		let n = {
			...e,
			runtimePartIndex: t
		};
		return typeof n.sourcePathId == "number" && (n.sourcePathId = E(n.sourcePathId, t)), typeof n.springManagerPathId == "number" && (n.springManagerPathId = E(n.springManagerPathId, t)), n;
	});
}
function E(e, t) {
	return (t + 1) * 1e9 + e;
}
function et(e, t) {
	return Object.fromEntries(Object.entries(e).map(([e, n]) => [e, Array.isArray(n) ? n.map((e) => typeof e == "number" ? E(e, t) : e).filter((e) => typeof e == "number") : []]));
}
var tt = [
	[1, "CL_Hip"],
	[2, "CL_Chest"],
	[4, "CL_Left_Arm"],
	[8, "CL_Right_Arm"],
	[16, "CL_Left_Elbow"],
	[32, "CL_Right_Elbow"]
];
function nt(e) {
	return tt.filter(([t]) => (e & t) !== 0).map(([, e]) => e);
}
function rt(e) {
	return e.flatMap((e) => e.partType === "body" ? [] : e.bones.filter((t) => (t.colliderFlag ?? 0) === 0 || typeof t.pathId != "number" ? !1 : !e.colliderBindings.some((e) => e.sourceSpringBonePathId === t.pathId && (e.sourceKind === "deferred_body_colliderFlag" || e.sourceKind === "colliderFlag"))).map((t) => ({
		sourceKind: "deferred_body_colliderFlag",
		partKind: t.partKind ?? e.partType,
		sourceSpringBonePathId: t.pathId,
		colliderFlag: t.colliderFlag,
		matchedPrefixes: nt(t.colliderFlag ?? 0),
		collidersByRoot: {},
		defaultRoot: "body",
		sourceColliderPathIds: [],
		colliders: [],
		rebindReason: "viewer_synthesized_missing_colliderFlag_binding"
	})));
}
function it(e) {
	let t = e.filter((e) => e.partType === "body").flatMap((e) => e.colliders), n = ft(t);
	return rt(e).map((e) => at(e, t)).concat(e.flatMap((e) => e.colliderBindings.map((r) => {
		if (r.sourceKind === "deferred_body_colliderFlag" && e.partType !== "body") return at(r, t);
		if (r.sourceKind !== "colliderFlag" || e.partType === "body" || !pt(n)) return r;
		let i = mt(n);
		return {
			...r,
			collidersByRoot: n,
			defaultRoot: i.root,
			colliders: i.indexes,
			sourceColliderPathIds: i.indexes.map((e) => t.find((t) => t.index === e)?.pathId).filter((e) => typeof e == "number"),
			rebindReason: "viewer_composed_current_body_colliders"
		};
	})));
}
function at(e, t) {
	let n = ot(e, t);
	return {
		...e,
		sourceKind: "colliderFlag",
		originalSourceKind: "deferred_body_colliderFlag",
		collidersByRoot: n.byRoot,
		defaultRoot: n.defaultRoot,
		colliders: n.indexes,
		sourceColliderPathIds: n.indexes.map((e) => t.find((t) => t.index === e)?.pathId).filter((e) => typeof e == "number"),
		rebindReason: "viewer_composed_deferred_body_colliderFlag"
	};
}
function ot(e, t) {
	let n = Nt(e.matchedPrefixes), r = ft(t.filter((e) => typeof e.index == "number" && st(e, n))), i = pt(r) ? mt(r).root : gt(e.defaultRoot ?? "body");
	return {
		byRoot: r,
		defaultRoot: i,
		indexes: r[i] ?? []
	};
}
function st(e, t) {
	if (!t.length) return !1;
	let n = w(e.nodeName);
	return t.some((e) => n.startsWith(e));
}
function ct(e, t) {
	let n = new Map(e.filter((e) => typeof e.pathId == "number").map((e) => [e.pathId, e]));
	return t.filter((e) => typeof e.sourceSpringBonePathId == "number").map((e) => {
		let t = n.get(e.sourceSpringBonePathId), r = pt(e.collidersByRoot) ? e.collidersByRoot : { [e.defaultRoot ?? t?.poseRoot ?? "unknown"]: e.colliders ?? [] };
		return {
			sourceKind: e.sourceKind ?? "direct",
			partKind: e.partKind ?? t?.partKind ?? "Unknown",
			sourceSpringBonePathId: e.sourceSpringBonePathId,
			nodePath: t?.nodePath ?? null,
			poseRoot: t?.poseRoot ?? null,
			colliderFlag: typeof e.colliderFlag == "number" ? e.colliderFlag : null,
			directColliderPathIds: e.sourceKind === "direct" ? e.sourceColliderPathIds ?? [] : [],
			candidateRoots: r,
			defaultRoot: e.defaultRoot ?? null,
			selectedColliderIndexes: e.colliders ?? [],
			reason: e.sourceKind === "colliderFlag" ? "viewer custom composer rebound colliderFlag candidates to current body colliders" : "direct serialized collider references"
		};
	});
}
function lt(e, t) {
	let n = new Map(e.flatMap((e) => e.colliders).filter((e) => typeof e.index == "number").map((e) => [e.index, e]));
	return e.flatMap((e) => e.managerColliderCaches.map((r) => e.partType === "head" || e.partType === "hair" ? ut(r, t, n) : dt(r, n)));
}
function ut(e, t, n) {
	let r = new Set(A(e.springBonePathIds)), i = Ft(t.filter((e) => typeof e.sourceSpringBonePathId == "number" && r.has(e.sourceSpringBonePathId) && e.sourceKind === "colliderFlag").flatMap((e) => A(e.colliders)).filter((e) => n.has(e)));
	return i.length ? {
		...e,
		sphereColliderIndexes: i.filter((e) => w(n.get(e)?.scriptName).includes("Sphere")),
		capsuleColliderIndexes: i.filter((e) => w(n.get(e)?.scriptName).includes("Capsule")),
		panelColliderIndexes: i.filter((e) => w(n.get(e)?.scriptName).includes("Panel")),
		reason: "viewer_composed_head_body_collider_cache"
	} : dt(e, n);
}
function dt(e, t) {
	return {
		...e,
		sphereColliderIndexes: A(e.sphereColliderIndexes).filter((e) => t.has(e)),
		capsuleColliderIndexes: A(e.capsuleColliderIndexes).filter((e) => t.has(e)),
		panelColliderIndexes: A(e.panelColliderIndexes).filter((e) => t.has(e)),
		reason: "viewer_composed_active_parts_manager_cache"
	};
}
function ft(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		if (typeof n.index != "number") continue;
		let e = gt(_t(n.nodePath) ?? n.poseRoot ?? "body"), r = t.get(e) ?? [];
		r.push(n.index), t.set(e, r);
	}
	return Object.fromEntries([...t.entries()].map(([e, t]) => [e, [...new Set(t)].sort((e, t) => e - t)]));
}
function pt(e) {
	return !!(e && Object.values(e).some((e) => e.length > 0));
}
function mt(e) {
	let [t, n] = Object.entries(e).sort(([e], [t]) => ht(e) - ht(t) || e.localeCompare(t))[0];
	return {
		root: t,
		indexes: n
	};
}
function ht(e) {
	return e === "body" ? 0 : e === "sit_body" ? 1 : e === "guitar_body" ? 2 : 10;
}
function gt(e) {
	return (e ?? "").trim() || "body";
}
function _t(e) {
	return e?.split("/").find(Boolean) ?? null;
}
function vt(e, t) {
	let n = [...t.warnings ?? []], r = [];
	for (let [i, a] of e.entries()) {
		let e = c(a.part);
		for (let o of k(a.nativeMeshes?.meshes)) {
			let a = yt(o, i);
			if (e !== "head_optional") {
				r.push(a);
				continue;
			}
			let s = w(a.rendererTransformPath), c = k(t.prefabGraphs).find((e) => Tt(e.runtimePartIndex, -1) === i && !!w(e.headOptionalAttachPath)), l = w(c?.headOptionalPrefabRootPath);
			if (!c || !l) {
				n.push(`Head optional mesh '${w(o.meshPath) || w(o.meshName) || "<unnamed>"}' was skipped because the official prefab could not be mounted.`);
				continue;
			}
			s !== l && !s.startsWith(`${l}/`) || r.push({
				...a,
				sourceRendererTransformPath: s,
				rendererTransformPath: s
			});
		}
	}
	return {
		version: "0414",
		meshes: r,
		warnings: n
	};
}
function yt(e, t) {
	let n = { ...e };
	for (let e of [
		"rendererPathId",
		"rendererTransformPathId",
		"rootBonePathId"
	]) typeof n[e] == "number" && (n[e] = E(n[e], t));
	return Array.isArray(n.bonePathIds) && (n.bonePathIds = n.bonePathIds.map((e) => typeof e == "number" ? E(e, t) : e)), n;
}
function bt(e) {
	let t = [
		...e.filter((e) => c(e.part) === "head"),
		...e.filter((e) => c(e.part) === "hair"),
		...e.filter((e) => c(e.part) !== "head_optional")
	];
	for (let e of t) {
		let t = xt(w(e.source?.bundlePath));
		if (t) return t;
		let n = xt(w(e.part.modelAssetbundleName));
		if (n) return n;
	}
	return null;
}
function xt(e) {
	let t = e.replace(/\\/g, "/").replace(/\.bundle$/i, "").match(/(?:^|\/)face\/([^/]+)\/([^/]+)$/i);
	return t ? `${t[1]}/${t[2]}` : null;
}
function St(e, t) {
	if (!t) return null;
	let n = Ct(e)[t];
	return O(n) ? n : null;
}
function Ct(e) {
	return Mt(e.mount?.accessoryTransformAdjustments);
}
function wt(e, t, n, r) {
	let i = Mt(e);
	return {
		x: Tt(i.x ?? i.X, t),
		y: Tt(i.y ?? i.Y, n),
		z: Tt(i.z ?? i.Z, r)
	};
}
function Tt(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function Et(e) {
	return (e?.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? "") || null;
}
function Dt(e, t, n) {
	if (!t) return e;
	let r = Ot([], [t], n), i = new Map(r.filter((e) => e.materialKind === "eye" || e.materialKind === "eyelight").map((e) => [e.materialKind, e]));
	return e.map((e) => {
		if (e.mainTex || e.materialKind !== "eye" && e.materialKind !== "eyelight") return e;
		let t = i.get(e.materialKind);
		return t?.mainTex ? {
			...e,
			mainTex: t.mainTex
		} : e;
	});
}
function Ot(e, t, n) {
	let r = t.flatMap((e) => {
		let t = ye(e, n);
		return (e.materialSlots ?? []).map((e) => kt(e, t));
	});
	if (r.length) return r;
	let i = t[0] ? ye(t[0], n) : n;
	return [...e ?? []].map((e) => kt(e, i));
}
function kt(e, t) {
	return {
		...e,
		mainTex: D(e.mainTex ?? void 0, t) ?? e.mainTex,
		shadowTex: D(e.shadowTex ?? void 0, t) ?? e.shadowTex,
		valueTex: D(e.valueTex ?? void 0, t) ?? e.valueTex,
		faceShadowTex: D(e.faceShadowTex ?? void 0, t) ?? e.faceShadowTex,
		rawMaterial: e.rawMaterial ? {
			...e.rawMaterial,
			textureProperties: e.rawMaterial.textureProperties.map((e) => ({
				...e,
				uri: D(e.uri ?? void 0, t) ?? e.uri
			}))
		} : e.rawMaterial
	};
}
function D(e, t) {
	return e && t(e);
}
function At(e, t) {
	return e ? t(e) : "";
}
function jt(e) {
	return JSON.parse(JSON.stringify(e));
}
function O(e) {
	return !!(e && typeof e == "object" && !Array.isArray(e));
}
function Mt(e) {
	return O(e) ? e : {};
}
function Nt(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "string") : [];
}
function k(e) {
	return Array.isArray(e) ? e.filter((e) => O(e)) : [];
}
function A(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "number") : [];
}
function Pt(e) {
	return [...new Set(e)];
}
function Ft(e) {
	return [...new Set(e)].sort((e, t) => e - t);
}
//#endregion
//#region src/parts/customWardrobeController.ts
var It = class {
	options;
	partSet = null;
	selection = null;
	activeRoleId = null;
	combined = null;
	constructor(e) {
		this.options = e;
	}
	loadPartPackageSet(e, t = {}) {
		this.partSet = e;
		let n = t.composeDefault ?? !0;
		return this.selection = n ? p(e) : null, this.activeRoleId = this.selection ? f(this.selection.characterId, this.selection.unit) : null, this.combined = this.selection ? this.compose(this.selection) : null, this.combined;
	}
	clear() {
		this.partSet = null, this.selection = null, this.activeRoleId = null, this.combined = null;
	}
	getPartPackageSet() {
		return this.partSet;
	}
	getCustomSelection() {
		return this.selection ? { ...this.selection } : null;
	}
	getActiveCharacterId() {
		return this.selection?.characterId ?? null;
	}
	getActiveRoleId() {
		return this.activeRoleId;
	}
	selectRole(e, t) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		this.activeRoleId = f(e, t), this.selection && f(this.selection.characterId, this.selection.unit) !== this.activeRoleId && (this.selection = null, this.combined = null);
	}
	getCombinedCharacter() {
		return this.combined;
	}
	listCustomParts(e, t, n = {}) {
		return this.partSet ? m(this.partSet, e, t, n) : [];
	}
	async setCustomSelection(e, t = () => !0) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		let n = this.resolveHeadSource(e);
		if (this.assertSameActiveCharacter(n), await this.ensureSelectionPackages(n), await this.options.ensureCompatibility?.(n), !t()) throw Lt();
		this.activeRoleId ??= f(n.characterId, n.unit);
		let r = this.compose(n);
		return this.selection = { ...n }, this.combined = r, r;
	}
	updateCustomSelection(e, t) {
		if (!this.selection) throw Error("No custom selection is active.");
		let n = {
			...this.selection,
			bodyCostume3dId: e === "body" && t !== null ? t : this.selection.bodyCostume3dId,
			headCostume3dId: e === "head" && t !== null ? t : this.selection.headCostume3dId,
			headPackagePath: e === "head" && t !== null ? null : this.selection.headPackagePath,
			hairCostume3dId: e === "hair" && t !== null ? t : this.selection.hairCostume3dId,
			headOptionalCostume3dId: e === "head_optional" ? t : this.selection.headOptionalCostume3dId
		};
		return this.setCustomSelection(n);
	}
	async composeCustomCharacter(e) {
		let t = this.resolveHeadSource(e);
		return this.assertSameActiveCharacter(t), await this.ensureSelectionPackages(t), await this.options.ensureCompatibility?.(t), this.compose(t);
	}
	resolveHeadSource(e) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		let t = x(this.partSet, e);
		return {
			...e,
			headPackagePath: t.packagePath
		};
	}
	assertSameActiveCharacter(e) {
		let t = f(e.characterId, e.unit);
		if (this.activeRoleId !== null && t !== this.activeRoleId) throw Error(`Custom switching is limited to active role ${this.activeRoleId}. Select/reload role ${t} before switching parts.`);
	}
	async ensureSelectionPackages(e) {
		if (!this.partSet || !this.options.loadPartRuntime) return;
		let t = x(this.partSet, e), n = this.partSet.roles.find((t) => f(t.characterId, t.unit) === f(e.characterId, e.unit)), r = [
			this.findRegistryEntry(e, "body", e.bodyCostume3dId),
			n ? this.findRegistryEntry(e, "body", n.bodyCostume3dId) : null,
			t,
			this.findRegistryEntry(e, "hair", e.hairCostume3dId),
			ie(this.partSet, e),
			l(t) === "head" ? _(this.partSet, e) : null
		].filter((e) => e !== null && e.status !== "empty");
		await Promise.all(r.map(async (e) => {
			if (!this.partSet.packages.has(e.packagePath) && !await this.options.loadPartRuntime(e)) throw Error(`Failed to load ${e.partType} package ${e.packagePath}.`);
		}));
	}
	findRegistryEntry(e, t, n) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		let r = m(this.partSet, e.characterId, t, {
			unit: e.unit,
			loadedOnly: !1
		}).find((e) => e.costume3dId === n);
		if (!r) throw Error(`No ${t} registry entry for role ${f(e.characterId, e.unit)}, costume3dId ${n}.`);
		return r;
	}
	compose(e) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		return h({
			partSet: this.partSet,
			selection: e,
			activeRoleId: this.activeRoleId ?? f(e.characterId, e.unit),
			resolveUrl: this.options.resolveUrl
		});
	}
};
function Lt() {
	let e = /* @__PURE__ */ Error("Custom part selection was superseded by a newer request.");
	return e.name = "AbortError", e;
}
//#endregion
//#region src/runtime/brotliWasmAsset.ts
var Rt = "" + new URL("assets/brotli_wasm_bg-NfWIZley.wasm", import.meta.url).href, zt = 64 * 1024, j = null, Bt = 1, Vt = /* @__PURE__ */ new Map();
async function Ht(e) {
	if (e.byteLength < zt || typeof Worker > "u") return Ut(e);
	let t = Wt();
	if (!t) return Ut(e);
	let n = Bt++;
	return new Promise((r, i) => {
		Vt.set(n, {
			resolve: r,
			reject: i
		}), t.postMessage({
			id: n,
			bytes: e,
			wasmUrl: Rt
		}, [e]);
	});
}
async function Ut(e) {
	let { decodeRuntimeMessagePackBrotliDirect: t } = await import("./runtimeMessagePackDecodeCore-BptdOkvu.js");
	return t(e, Rt);
}
function Wt() {
	if (j) return j;
	try {
		return j = new Worker(new URL(
			/* @vite-ignore */
			"" + new URL("assets/runtimeDecodeWorker-ztxrM9TB.js", import.meta.url).href,
			"" + import.meta.url
		), {
			type: "module",
			name: "haruki-runtime-decoder"
		}), j.onmessage = ({ data: e }) => {
			let t = Vt.get(e.id);
			t && (Vt.delete(e.id), e.error ? t.reject(Error(e.error)) : t.resolve(e.value));
		}, j.onerror = () => Gt("Runtime decode worker failed."), j;
	} catch {
		return j = null, null;
	}
}
function Gt(e) {
	j?.terminate(), j = null;
	for (let t of Vt.values()) t.reject(Error(e));
	Vt.clear();
}
//#endregion
//#region src/runtime/runtimePackageLoader.ts
var M = /* @__PURE__ */ new Map(), Kt = 16, qt = /* @__PURE__ */ new Map();
async function Jt(e, t) {
	let n = /* @__PURE__ */ new Map(), r = await Xt(e, t), i = new It({
		resolveUrl: (t) => N(e, t),
		loadPartRuntime: async (t) => tn(r, t, e),
		ensureCompatibility: async (t) => an(r, t.unit, e)
	}), a = i.loadPartPackageSet(r, { composeDefault: !t.deferDefaultSelection });
	if (!a && !t.deferDefaultSelection) throw Error(`Part registry package did not expose a default custom selection from ${e}.`);
	return {
		kind: "part-registry",
		combinedCharacter: a,
		previewLight: null,
		faceMotion: null,
		displayNameByUrl: n,
		partSet: r,
		wardrobe: i
	};
}
function N(e, t) {
	let n = new URL(e, window.location.href);
	n.pathname.endsWith("/") || (n.pathname = `${n.pathname}/`);
	let r = t.replace(/\\/g, "/").replace(/^\/+/, "").split("/").filter((e) => e.length > 0);
	if (r.length === 0 || r.some((e) => e === "." || e === "..")) throw Error(`Invalid runtime package relative path: ${t}`);
	let i = r.map((e) => encodeURIComponent(e)).join("/");
	return new URL(i, n).toString();
}
function Yt(e, t) {
	if (!t) return e;
	let n = new URL(e, window.location.href);
	return n.searchParams.set("masterVersion", t), n.toString();
}
async function Xt(e, t) {
	let n = on(t.roleId), r = `parts/by-role/${n.characterId}/${un(n.unit)}`, i = await P(N(e, `${r}/runtime-role-catalog.msgpack.br`)), a = sn(i, n.characterId, n.unit), o = hn(await P(Yt(N(e, `${r}/part-registry.msgpack.br`), i.masterVersion))), s = /* @__PURE__ */ new Map();
	if (t.deferDefaultSelection) return {
		registry: o,
		roles: a,
		masterVersion: i.masterVersion,
		compatibility: null,
		packages: s,
		roleRuntimes: /* @__PURE__ */ new Map(),
		baseUrl: e
	};
	let c = gn(o, a, null);
	for (let t = 0; t < Math.min(c.length, 720); t += 24) {
		let n = c.slice(t, t + 24), r = await Promise.all(n.map(async (t) => ({
			entry: t,
			runtime: await rn(e, t)
		})));
		for (let e of r) e.runtime && s.set(e.entry.packagePath, dn(e.runtime, e.entry));
		if (yn(o, a, null, s, e)) break;
	}
	if (!yn(o, a, null, s, e)) throw Error(`Part registry package did not expose a compatible loaded body/head/hair selection from ${e}.`);
	let l = p({
		registry: o,
		roles: a,
		compatibility: null,
		packages: s,
		roleRuntimes: /* @__PURE__ */ new Map(),
		baseUrl: e
	}), u = l ? /* @__PURE__ */ new Set([f(l.characterId, l.unit)]) : null, d = await Qt(e, a, i.masterVersion, u);
	return {
		registry: o,
		roles: a,
		masterVersion: i.masterVersion,
		compatibility: null,
		packages: s,
		roleRuntimes: d,
		baseUrl: e
	};
}
async function Zt(e, t, n) {
	let r = f(t, n), i = e.roleRuntimes.get(r);
	if (i) return i;
	let a = e.roles.find((e) => e.roleRuntimePath && e.characterId === t && f(e.characterId, e.unit ?? null) === r);
	if (!a?.roleRuntimePath) return null;
	let o = await mn(Yt(N(e.baseUrl, a.roleRuntimePath), e.masterVersion));
	if (!o) return null;
	let s = $t(e.baseUrl, a.roleRuntimePath, o, e.masterVersion), c = s.role?.characterId ?? t, l = s.role?.unit ?? n;
	return e.roleRuntimes.set(f(c, l), s), s;
}
async function Qt(e, t, n, r = null) {
	let i = /* @__PURE__ */ new Map(), a = t.filter((e) => e.roleRuntimePath && (!r || r.has(f(e.characterId, e.unit ?? null)))), o = await Promise.all(a.map(async (t) => ({
		entry: t,
		runtime: await mn(Yt(N(e, t.roleRuntimePath), n))
	})));
	for (let t of o) {
		if (!t.runtime) continue;
		let r = t.runtime.role?.characterId ?? t.entry.characterId, a = t.runtime.role?.unit ?? t.entry.unit ?? null, o = $t(e, t.entry.roleRuntimePath, t.runtime, n);
		i.set(f(r, a), o);
	}
	return i;
}
function $t(e, t, n, r) {
	let i = n.motionPackage, a = i?.unityMotionJson;
	if (!a) return n;
	let o = /^[a-z][a-z0-9+.-]*:/i.test(a) || a.startsWith("/") ? new URL(a, window.location.href).toString() : N(e, en(t, a));
	return {
		...n,
		motionPackage: {
			...i,
			unityMotionJson: Yt(o, r)
		}
	};
}
function en(e, t) {
	let n = e.replace(/\\/g, "/").split("/").slice(0, -1).join("/");
	return n ? `${n}/${t.replace(/^\/+/, "")}` : t;
}
async function tn(e, t, n = e.baseUrl) {
	let r = e.packages.get(t.packagePath);
	if (r) return r;
	let i = dn(await nn(n, t), t);
	return e.packages.set(t.packagePath, i), i;
}
async function nn(e, t) {
	let n = await P(N(e, `${t.packagePath}/part-runtime.msgpack.br`));
	if (!n.corePath?.endsWith(".msgpack.br")) throw Error(`Part runtime must reference a .msgpack.br shared core: ${t.packagePath}.`);
	return a(n, await P(N(e, n.corePath)));
}
async function rn(e, t) {
	try {
		return await nn(e, t);
	} catch {
		return null;
	}
}
async function an(e, t, n = e.baseUrl) {
	e.compatibility ||= await P(Yt(N(n, `parts/compat/by-unit/${un(t)}/head-hair-compatibility.msgpack.br`), e.masterVersion));
}
function on(e) {
	if (!e) throw Error("Runtime role id is required.");
	let [t, ...n] = e.split(":"), r = Number(t);
	if (!Number.isInteger(r) || r <= 0) throw Error(`Invalid runtime role id: ${e}`);
	return {
		characterId: r,
		unit: n.join(":") || null
	};
}
function sn(e, t, n) {
	let r = (e?.version === 2 || e?.version === 3 || e?.version === 4) && typeof e.masterVersion == "string" && e.masterVersion.length > 0 && Array.isArray(e.roles) ? e.roles : [];
	if (r.length !== 1) throw Error(`Runtime role catalog must contain exactly one scoped role for ${f(t, n)}.`);
	let i = r[0], a = ln(i.roleId), o = a ? `roles/${a.characterId}/${un(a.unit)}/role-runtime.msgpack.br` : "";
	if (!a || i.characterId !== t || f(i.characterId, i.unit) !== f(t, n) || i.characterId !== a.characterId || f(i.characterId, i.unit) !== f(a.characterId, a.unit) || !Number.isInteger(i.roleId) || i.roleId < 1 || i.roleId > 31 || !Number.isInteger(i.bodyCostume3dId) || i.bodyCostume3dId <= 0 || !Number.isInteger(i.headCostume3dId) || i.headCostume3dId <= 0 || !Number.isInteger(i.hairCostume3dId) || i.hairCostume3dId <= 0 || e.version >= 3 && !cn(i.skinColors) || e.version >= 4 && (typeof i.characterHeightMeters != "number" || !Number.isFinite(i.characterHeightMeters) || i.characterHeightMeters <= 0) || i.roleRuntimePath !== o) throw Error(`Runtime role catalog is invalid for ${f(t, n)}.`);
	return r;
}
function cn(e) {
	let t = (e) => typeof e == "string" && /^#[0-9a-f]{6}$/i.test(e);
	return !!(e && t(e.default) && t(e.shadow1) && t(e.shadow2));
}
function ln(e) {
	return !Number.isInteger(e) || e < 1 || e > 31 ? null : e <= 20 ? {
		characterId: e,
		unit: e <= 4 ? "light_sound" : e <= 8 ? "idol" : e <= 12 ? "street" : e <= 16 ? "theme_park" : "school_refusal"
	} : e <= 26 ? {
		characterId: 21,
		unit: [
			"piapro",
			"idol",
			"light_sound",
			"street",
			"theme_park",
			"school_refusal"
		][e - 21]
	} : {
		characterId: e - 5,
		unit: "piapro"
	};
}
function un(e) {
	return e || "default";
}
function dn(e, t) {
	return {
		...e,
		packagePath: t.packagePath,
		mount: {
			...e.mount ?? {},
			packagePath: t.packagePath
		}
	};
}
async function P(e) {
	if (!/\.msgpack\.br(?:[?#]|$)/i.test(e)) throw Error(`Runtime metadata must use .msgpack.br: ${e}`);
	let t = qt.get(e);
	if (t) return t;
	let n = (async () => {
		let t = await fetch(e);
		if (!t.ok) throw Error(`Failed to load ${e}: HTTP ${t.status}`);
		return fn(t, e);
	})();
	qt.set(e, n);
	try {
		return await n;
	} finally {
		qt.get(e) === n && qt.delete(e);
	}
}
async function fn(e, t) {
	try {
		let n = e.headers.get("x-haruki-file-version"), r = n && pn(t) ? M.get(t) : null;
		if (r?.version === n) return M.delete(t), M.set(t, r), await e.body?.cancel(), r.value;
		let i = await Ht(await e.arrayBuffer());
		if (n && pn(t)) for (M.delete(t), M.set(t, {
			version: n,
			value: i
		}); M.size > Kt;) M.delete(M.keys().next().value);
		return i;
	} catch (e) {
		throw e instanceof Error ? e : /* @__PURE__ */ Error(`Failed to decode ${t}: ${String(e)}`);
	}
}
function pn(e) {
	let t = e.split(/[?#]/, 1)[0] ?? e;
	return /\/parts\/by-role\/[^/]+\/[^/]+\/(?:part-registry|runtime-role-catalog)\.msgpack\.br$/.test(t) || /\/parts\/compat\/by-unit\/[^/]+\/head-hair-compatibility\.msgpack\.br$/.test(t) || /\/roles\/[^/]+\/[^/]+\/(?:role-runtime|motion\/unity-motion)\.msgpack\.br$/.test(t);
}
async function mn(e) {
	try {
		return await P(e);
	} catch {
		return null;
	}
}
function hn(e) {
	return Array.isArray(e) ? e : e.entries ?? e.parts ?? [];
}
function gn(e, t, n) {
	let r = t.find((e) => typeof e.characterId == "number")?.characterId ?? e.find(vn)?.characterId ?? null, i = [], a = /* @__PURE__ */ new Set(), o = (e) => {
		if (!e || !vn(e)) return;
		let t = e.packagePath;
		a.has(t) || (a.add(t), i.push(e));
	}, s = (t, n, r, i) => e.find((e) => e.characterId === t && e.costume3dId === r && l(e) === n && (i === void 0 || e.unit === i) && _n(e)), c = pe(n);
	if (r !== null) {
		for (let e of t) e.characterId === r && (typeof e.bodyCostume3dId == "number" && o(s(e.characterId, "body", e.bodyCostume3dId, e.unit)), typeof e.headCostume3dId == "number" && (o(s(e.characterId, "head", e.headCostume3dId, e.unit)), o(s(e.characterId, "head_optional", e.headCostume3dId, e.unit))), typeof e.hairCostume3dId == "number" && o(s(e.characterId, "hair", e.hairCostume3dId, e.unit)));
		o(e.filter((e) => e.characterId === r && l(e) === "body" && _n(e)).sort((e, t) => e.costume3dId - t.costume3dId)[0]);
		let n = e.filter((e) => e.characterId === r && ["head", "head_optional"].includes(l(e) ?? "") && _n(e)).sort((e, t) => e.costume3dId - t.costume3dId), i = e.filter((e) => e.characterId === r && l(e) === "hair" && _n(e)).sort((e, t) => e.costume3dId - t.costume3dId);
		for (let e of n) for (let t of i) l(e) !== "head" && c.has(me(e.unit ?? t.unit, e.costume3dId, t.costume3dId)) || (o(e), o(t));
	}
	let u = /* @__PURE__ */ new Set();
	for (let e of t) if (!(r !== null && e.characterId !== r)) for (let t of [
		e.bodyCostume3dId,
		e.headCostume3dId,
		e.hairCostume3dId
	]) typeof t == "number" && u.add(t);
	let d = e.filter(vn).filter((e) => !a.has(e.packagePath)).map((e, t) => ({
		entry: e,
		index: t,
		score: (r !== null && e.characterId === r ? 0 : 1e6) + (u.has(e.costume3dId) ? 0 : 1e4) + bn(e) + Math.min(e.costume3dId, 9999)
	})).sort((e, t) => e.score - t.score || e.index - t.index);
	return [...i, ...d.map((e) => e.entry)];
}
function _n(e) {
	return e.status !== "missing";
}
function vn(e) {
	return _n(e) && e.status !== "empty";
}
function yn(e, t, n, r, i) {
	let a = new Set(e.filter((e) => r.has(e.packagePath)).map((e) => l(e)).filter(Boolean));
	return !a.has("body") || !a.has("head") && !a.has("head_optional") || !a.has("hair") ? !1 : !!p({
		registry: e,
		roles: t,
		compatibility: n,
		packages: r,
		roleRuntimes: /* @__PURE__ */ new Map(),
		baseUrl: i
	});
}
function bn(e) {
	switch (l(e)) {
		case "body": return 0;
		case "head": return 100;
		case "hair": return 200;
		case "head_optional": return 300;
		default: return 1e3;
	}
}
//#endregion
//#region src/engine/utjSpringBoneRuntime.ts
var xn = /* @__PURE__ */ function(e) {
	return e[e.NoCollision = 0] = "NoCollision", e[e.HeadIsEmbedded = 1] = "HeadIsEmbedded", e[e.TailCollision = 2] = "TailCollision", e;
}({}), F = 1e-5, Sn = .001, Cn = new e.Vector3(1, 0, 0);
function wn(t, n) {
	return {
		currTipPos: n.clone(),
		prevTipPos: n.clone(),
		hitNormal: new e.Vector3(0, 0, 0),
		cachedPosition: t.clone(),
		cachedMovement: new e.Vector3(0, 0, 0)
	};
}
function Tn(e) {
	let t = e.parentRotation.clone().multiply(e.initialLocalRotation), n = e.boneAxis.clone().applyQuaternion(t);
	return e.headPosition.clone().addScaledVector(n, e.springLength);
}
function En(e, t) {
	let n = e.currTipPos.clone(), r = Tn(t).sub(e.currTipPos).multiplyScalar(t.stiffnessForce), i = t.springForce.clone().add(t.externalForce).add(r), a = e.currTipPos.clone().sub(e.prevTipPos).multiplyScalar(1 - t.dragForce);
	e.currTipPos.add(a).addScaledVector(i, t.deltaTime * t.deltaTime * .5), e.prevTipPos.copy(n), On(e.currTipPos, t.headPosition, t.springLength, t.lengthFallbackDirection ?? t.boneAxis);
}
function Dn(e, t) {
	e.cachedMovement.copy(t).sub(e.cachedPosition), e.cachedPosition.copy(t);
}
function On(e, t, n, r = Cn) {
	let i = e.clone().sub(t);
	i.lengthSq() <= Sn * Sn && i.copy(r), i.normalize(), e.copy(t).addScaledVector(i, n);
}
function kn(t, n, r, i, a, o = Cn) {
	let s = r.clone().sub(n), c = s.length();
	if (c <= Sn) {
		s.copy(o).normalize(), t.copy(n).addScaledVector(s, i);
		return;
	}
	let l = e.MathUtils.clamp(c, i, a);
	t.copy(n).addScaledVector(s, l / c);
}
function An(t) {
	if (t.targets.length === 0) return;
	let n = t.springConstant * t.deltaTime * t.deltaTime, r = new e.Vector3();
	for (let e of t.targets) {
		let i = t.currTipPos.clone().sub(e.position), a = i.length();
		if (a <= F) continue;
		let o = a - e.initialLength;
		r.addScaledVector(i, -(n * o) / a);
	}
	t.currTipPos.add(r);
}
function jn(e, t) {
	let n = 0, r = null;
	e.currTipPos.clone();
	for (let i of Jn(t.colliders)) {
		if (i.enabled === !1) continue;
		let a = Pn(i, t.headPosition, e.currTipPos, t.tailRadius, t.springLength);
		t.onColliderCheck?.(i, {
			status: a.status,
			beforeTailPosition: e.currTipPos.clone(),
			afterTailPosition: a.tailPosition.clone(),
			hitNormal: a.hitNormal.clone(),
			details: Mn(i, t.headPosition, e.currTipPos, a.tailPosition, t.tailRadius)
		}), a.status !== 0 && (e.currTipPos.copy(a.tailPosition), e.hitNormal.copy(a.hitNormal), r = a.hitNormal, n = a.status, t.onCollision?.(i, a));
	}
	return r && Gn(e, r, t.bounce, t.friction), n;
}
function Mn(e, t, n, r, i) {
	return e.kind === "sphere" ? {
		kind: e.kind,
		localHeadPosition: t.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionBefore: n.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionAfter: r.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailRadius: i * e.worldToLocalRadiusScale,
		localSphereOrigin: e.localOffset.clone(),
		localSphereRadius: e.radius
	} : e.kind === "capsuleLocal" ? {
		kind: e.kind,
		localHeadPosition: t.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionBefore: n.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionAfter: r.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailRadius: i * e.worldToLocalRadiusScale,
		localCapsuleStart: e.localStart.clone(),
		localCapsuleEnd: e.localEnd.clone(),
		capsuleRadius: e.radius
	} : e.kind === "panel" ? {
		kind: e.kind,
		localHeadPosition: t.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionBefore: n.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionAfter: r.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailRadius: i * e.worldToLocalRadiusScale,
		panelWidth: e.width,
		panelHeight: e.height
	} : {
		kind: e.kind,
		localHeadPosition: t.clone(),
		localTailPositionBefore: n.clone(),
		localTailPositionAfter: r.clone(),
		localTailRadius: i,
		localCapsuleStart: e.start.clone(),
		localCapsuleEnd: e.end.clone(),
		capsuleRadius: e.radius
	};
}
function Nn(e, t) {
	let n = t.headPosition.clone();
	n.y -= t.groundHeight;
	let r = e.currTipPos.clone();
	return r.y -= t.groundHeight, In(n, e.currTipPos.distanceTo(t.headPosition), r, t.tailRadius, 1) === 0 ? !1 : (r.y += t.groundHeight, kn(e.currTipPos, t.headPosition, r, t.springLength * .5, t.springLength, t.lengthFallbackDirection), e.prevTipPos.copy(e.currTipPos), e.hitNormal.set(0, 1, 0), !0);
}
function Pn(e, t, n, r, i) {
	return e.kind === "sphere" ? Rn(t, n, r, e) : e.kind === "capsule" ? zn(t, n, r, e.start, e.end, e.radius) : e.kind === "panel" ? Fn(t, n, r, i, e) : Bn(t, n, r, e);
}
function Fn(t, n, r, i, a) {
	let o = n.clone().applyMatrix4(a.worldToLocalMatrix), s = r * a.worldToLocalRadiusScale;
	if (o.z >= s) return I(n);
	let c = a.width * .5, l = a.height * .5;
	if (Math.abs(o.x) >= c + s || Math.abs(o.y) >= l + s) return I(n);
	let u = t.clone().applyMatrix4(a.worldToLocalMatrix), d = i * a.worldToLocalLengthScale, f = 0, p = o.clone();
	if (o.z > 0 || u.z > 0) if (Math.abs(o.y) <= l && Math.abs(o.x) <= c) {
		if (f = In(u, d, p, s, 2), f === 0) return I(n);
	} else if (Math.abs(o.y) > l) {
		let t = o.y >= 0 ? l : -l, n = new e.Vector3(0, o.y - t, o.z);
		n.lengthSq() <= F * F ? n.set(0, 0, 0) : n.normalize(), p.set(o.x + n.x * s, t + n.y * s, n.z * s), f = 2;
	} else {
		let t = o.x >= 0 ? c : -c, n = new e.Vector3(o.x - t, 0, o.z);
		n.lengthSq() <= F * F ? n.set(0, 0, 0) : n.normalize(), p.set(t + n.x * s, o.y + n.y * s, n.z * s), f = 2;
	}
	else Math.abs(u.y) <= l ? Math.abs(u.x) <= c ? (f = 1, p.set(u.x, u.y, s)) : (f = 2, p.set(o.x < 0 ? -c : c, o.y, o.z)) : (f = 2, p.set(o.x, o.y >= 0 ? l : -l, o.z));
	return {
		status: f,
		tailPosition: p.applyMatrix4(a.localToWorldMatrix),
		hitNormal: Xn(new e.Vector3(0, 0, 1), a.localToWorldMatrix)
	};
}
function In(e, t, n, r, i) {
	if (R(n, i) >= r) return 0;
	let a = R(e, i);
	if (a + t <= r) return n.copy(e), Zn(n, i, a + t), 1;
	let o = (i + 1) % 3, s = (i + 2) % 3, c = R(n, o) - R(e, o), l = R(n, s) - R(e, s), u = Math.sqrt(c * c + l * l);
	if (u > .001) {
		let d = a - r, f = Math.sqrt(t * t - d * d) / u;
		Zn(n, o, R(e, o) + c * f), Zn(n, s, R(e, s) + l * f), Zn(n, i, r);
	} else n.copy(e);
	return 2;
}
function Ln(t, n, r, i, a, o = a, s = {}) {
	let c = r + a, l = n.clone().sub(i);
	if (l.lengthSq() >= c * c) return I(n);
	if (t.distanceToSquared(i) <= o * o) {
		let n = s.headEmbeddedFallback === !1 ? l.clone().multiplyScalar(1 / Math.sqrt(l.lengthSq())) : L(l, s.headEmbeddedFallback instanceof e.Vector3 ? s.headEmbeddedFallback : t.clone().sub(i).lengthSq() <= F * F ? new e.Vector3(0, 1, 0) : t.clone().sub(i));
		return {
			status: 1,
			tailPosition: i.clone().addScaledVector(n, c),
			hitNormal: n
		};
	}
	let u = Un(t, n.distanceTo(t), i, c);
	if (!u) return s.noIntersectionStatus === 2 ? {
		status: 2,
		tailPosition: n.clone(),
		hitNormal: L(n.clone().sub(i), l)
	} : I(n);
	let d = Wn(u, n);
	return {
		status: 2,
		tailPosition: d,
		hitNormal: L(d.clone().sub(i), l)
	};
}
function Rn(e, t, n, r) {
	let i = e.clone().applyMatrix4(r.worldToLocalMatrix), a = t.clone().applyMatrix4(r.worldToLocalMatrix), o = n * r.worldToLocalRadiusScale, s = r.radius, c = Ln(i, a, o, r.localOffset, s, s, {
		headEmbeddedFallback: !1,
		noIntersectionStatus: 2
	});
	return c.status === 0 ? I(t) : {
		status: c.status,
		tailPosition: c.tailPosition.clone().applyMatrix4(r.localToWorldMatrix),
		hitNormal: Xn(c.hitNormal.clone(), r.localToWorldNormalMatrix)
	};
}
function zn(t, n, r, i, a, o) {
	let s = a.clone().sub(i), c = s.lengthSq();
	if (c <= F * F) return Ln(t, n, r, i, o);
	let l = e.MathUtils.clamp(n.clone().sub(i).dot(s) / c, 0, 1), u = i.clone().addScaledVector(s, l), d = r + o, f = n.clone().sub(u);
	if (f.lengthSq() >= d * d) return I(n);
	if (l <= F) return Ln(t, n, r, i, o);
	if (l >= 1 - F) return Ln(t, n, r, a, o);
	let p = L(f, t.clone().sub(u)), m = e.MathUtils.clamp(t.clone().sub(i).dot(s) / c, 0, 1), h = i.clone().addScaledVector(s, m);
	return {
		status: t.distanceToSquared(h) <= o * o ? 1 : 2,
		tailPosition: u.addScaledVector(p, d),
		hitNormal: p
	};
}
function Bn(e, t, n, r) {
	let i = Vn(e.clone().applyMatrix4(r.worldToLocalMatrix), t.clone().applyMatrix4(r.worldToLocalMatrix), n * r.worldToLocalRadiusScale, r.localStart, r.localEnd, r.radius, 1);
	if (i.status === 0) return I(t);
	let a = i.tailPosition.clone().applyMatrix4(r.localToWorldMatrix), o = Xn(i.hitNormal, r.localToWorldNormalMatrix);
	return {
		status: i.status,
		tailPosition: a,
		hitNormal: o
	};
}
function Vn(t, n, r, i, a, o, s = 1) {
	if (o <= 1e-4) return I(n);
	let c = i.y <= a.y ? i : a, l = i.y <= a.y ? a : i, u = c.y, d = l.y;
	return n.y <= u || n.y >= d ? Ln(t, n, r, n.y < d ? c : l, o, Math.abs(s) * o, {
		headEmbeddedFallback: new e.Vector3(0, 0, 0),
		noIntersectionStatus: 2
	}) : Hn(t, n, r, o, s);
}
function Hn(t, n, r, i, a = 1) {
	let o = i + r, s = n.x * n.x + n.z * n.z;
	if (s > o * o) return I(n);
	let c = Math.sqrt(s), l = c > F ? n.x / c : 0, u = c > F ? n.z / c : 0, d = new e.Vector3(o * l, n.y, o * u), f = new e.Vector3(l, 0, u), p = t.x * t.x + t.z * t.z, m = Math.abs(a) * i;
	return {
		status: p <= m * m ? 1 : 2,
		tailPosition: d,
		hitNormal: f
	};
}
function Un(e, t, n, r) {
	let i = n.clone().sub(e), a = i.lengthSq(), o = Math.sqrt(a);
	if (o <= 0) return null;
	let s = i.multiplyScalar(1 / o), c = t * t, l = c + a - r * r, u = .5 / o, d = a * 4 * c - l * l;
	if (d < 0) return null;
	let f = l * u;
	return {
		origin: e.clone().addScaledVector(s, f),
		upVector: s,
		radius: u * Math.sqrt(d)
	};
}
function Wn(e, t) {
	let n = t.clone().sub(e.origin), r = e.origin.clone().addScaledVector(e.upVector, n.dot(e.upVector)), i = t.clone().sub(r), a = i.length();
	return a <= F || e.radius <= F ? e.origin.clone() : e.origin.clone().addScaledVector(i, e.radius / a);
}
function Gn(e, t, n, r, i = e.currTipPos) {
	let a = L(t, Cn), o = e.prevTipPos.clone(), s = i.clone().sub(o), c = a.clone().multiplyScalar(s.dot(a)), l = s.sub(c).multiplyScalar(1 - r).sub(c.multiplyScalar(n));
	if (l.lengthSq() <= 1e-4) {
		e.prevTipPos.copy(e.currTipPos);
		return;
	}
	e.prevTipPos.copy(e.currTipPos).sub(l);
	let u = e.currTipPos.distanceTo(o), d = l.length(), f = Math.max(d - u, 0);
	f > 0 && e.currTipPos.addScaledVector(l, f / d);
}
function Kn(e) {
	if (!e.limit.active) return !1;
	let t = e.vector, n = e.basisUp.dot(t), r = e.basisUp.clone().multiplyScalar(n), i = t.clone().sub(r), a = i.length(), o = a <= F ? i.set(0, 0, 0) : i.multiplyScalar(1 / a), s = e.basisSide.dot(o), c = 180 / Math.PI * Math.asin(s < -1 ? -1 : Number.isNaN(s) ? 1 : Math.min(s, 1)), l = c - c * e.springStrength * e.deltaTime * e.deltaTime, u = l <= e.limit.max ? l : e.limit.max, d = l < e.limit.min ? e.limit.min : u, f = d >= 0 ? e.limit.max : e.limit.min, p = 0;
	if (f < -1e-4 || f > 1e-4) {
		let e = d / f;
		e >= 0 && (p = Math.min(e, 1));
	}
	let m = f * p, h = Math.PI / 180 * m, g = e.basisSide.clone().multiplyScalar(Math.sin(h)).addScaledVector(e.basisForward, Math.cos(h)).multiplyScalar(a);
	return t.copy(r).add(g), m !== l;
}
function qn(t, n, r, i, a) {
	let o = r.clone().multiply(i), s = n.clone().sub(t).applyQuaternion(o.clone().invert());
	if (s.lengthSq() <= F * F) return i.clone();
	s.normalize();
	let c = new e.Quaternion().setFromUnitVectors(a.clone(), s);
	return i.clone().multiply(c);
}
function I(t) {
	return {
		status: 0,
		tailPosition: t.clone(),
		hitNormal: new e.Vector3(0, 0, 0)
	};
}
function Jn(e) {
	return [...e].sort((e, t) => Yn(e) - Yn(t));
}
function Yn(e) {
	return e.kind === "capsule" || e.kind === "capsuleLocal" ? 0 : e.kind === "sphere" ? 1 : 2;
}
function L(e, t) {
	return e.lengthSq() <= F * F && e.copy(t), e.lengthSq() <= F * F && e.copy(Cn), e.normalize();
}
function Xn(e, t) {
	let n = t.elements, r = e.x, i = e.y, a = e.z;
	return e.set(n[0] * r + n[4] * i + n[8] * a, n[1] * r + n[5] * i + n[9] * a, n[2] * r + n[6] * i + n[10] * a), L(e, Cn);
}
function R(e, t) {
	return t === 0 ? e.x : t === 1 ? e.y : e.z;
}
function Zn(e, t, n) {
	t === 0 ? e.x = n : t === 1 ? e.y = n : e.z = n;
}
//#endregion
//#region src/engine/unityCoordinateConversion.ts
var Qn = {
	right: new e.Vector3(1, 0, 0),
	left: new e.Vector3(-1, 0, 0),
	up: new e.Vector3(0, 1, 0),
	down: new e.Vector3(0, -1, 0),
	forward: new e.Vector3(0, 0, 1),
	back: new e.Vector3(0, 0, -1)
};
function z(t, n) {
	if (!t) return n.clone();
	let r = B(t.x ?? t.X), i = B(t.y ?? t.Y), a = B(t.z ?? t.Z);
	return r === null || i === null || a === null ? n.clone() : new e.Vector3(r, i, a);
}
function $n(t) {
	if (!t) return new e.Quaternion();
	let n = B(t.x ?? t.X), r = B(t.y ?? t.Y), i = B(t.z ?? t.Z), a = B(t.w ?? t.W);
	return n === null || r === null || i === null || a === null ? new e.Quaternion() : new e.Quaternion(n, r, i, a).normalize();
}
function er(t) {
	return new e.Vector3(-t.x, t.y, t.z);
}
function tr(e) {
	return er(e);
}
function nr(t) {
	return new e.Quaternion(t.x, -t.y, -t.z, t.w).normalize();
}
function rr(e) {
	return tr(Qn[e]);
}
function B(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
//#endregion
//#region src/engine/unityPrefabSpringRuntimeAdapter.ts
var ir = 1401298464324817e-60, ar = rr("right"), or = rr("left"), sr = rr("back"), cr = rr("down"), lr = class t {
	bones;
	missingNodes;
	skinnedBones;
	setupDiagnostics;
	externalForce = new e.Vector3(0, 0, 0);
	parentRotation = new e.Quaternion();
	headPosition = new e.Vector3();
	localRotation = new e.Quaternion();
	skinAnimationLocalRotation = new e.Quaternion();
	colliderLocalToWorld = new e.Matrix4();
	colliderWorldToLocal = new e.Matrix4();
	frameColliderCache = /* @__PURE__ */ new Map();
	angleVector = new e.Vector3();
	debugAnimatedTip = new e.Vector3();
	providerForce = new e.Vector3();
	providerWorldToLocal = new e.Matrix4();
	waveAxis = new e.Vector3();
	providerRight = new e.Vector3();
	providerUp = new e.Vector3();
	mainWindDirection = new e.Vector3();
	localBonePosition = new e.Vector3();
	additionalDirection = new e.Vector3();
	traceFilters = [];
	traceMaxEvents = 240;
	traceSequence = 0;
	traceEvents = [];
	constructor(e, t, n, r) {
		this.bones = e, this.missingNodes = t, this.skinnedBones = n, this.setupDiagnostics = r;
	}
	static fromPjskRuntimeExtension(e, n) {
		let r = ni(e);
		if (!r) return null;
		n.updateMatrixWorld(!0);
		let i = Dr(n), a = Er(r), o = Mr(n), s = [], c = Rr(r), l = gr(r, i, s, c), u = Pr(r), d = Fr(r), f = Ir(r, l), p = Nr(r), m = vr(r), h = _r(r, c, m), g = /* @__PURE__ */ new Set(), _ = /* @__PURE__ */ new Map(), v = [];
		for (let e of r.managers ?? []) {
			if (!zr(e.nodePath ?? e.poseRoot, c)) continue;
			let t = fr(i, e, _);
			for (let n of e.bonePathIds ?? []) {
				let o = p.get(n);
				if (!o || !zr(o.nodePath, c)) continue;
				if (!br(o, m)) {
					h.rejectedUnverifiedBoneSourceCount += 1;
					continue;
				}
				let _ = V(i, o.nodePath, o.runtimePartIndex);
				if (!_) {
					s.push(o.nodePath ?? o.nodeName ?? `bone:${n}`);
					continue;
				}
				if (g.has(_)) continue;
				let y = Sr(o, _, a, i), b = V(i, o.pivotNodePath, o.runtimePartIndex), ee = xr(r, e, o, u.get(n), d.get(n), e.pathId === void 0 ? void 0 : f.get(e.pathId), l), te = dr(e, o, _, y, b, Br(i, o), t, ee);
				te && (v.push(te), g.add(_));
			}
		}
		return v.sort((e, t) => Oi(e.node) - Oi(t.node)), v.length > 0 ? new t(v, s, o, h) : null;
	}
	getControlledTrackNodeNames() {
		return new Set(this.bones.map((e) => e.node.name).filter(Boolean));
	}
	setTraceBoneFilters(e, t = 240) {
		this.traceFilters = e.map((e) => e.trim().toLowerCase()).filter(Boolean), this.traceMaxEvents = Math.max(1, Math.trunc(t) || 240), this.traceSequence = 0, this.traceEvents.length = 0;
	}
	getTraceSnapshot() {
		return {
			filters: [...this.traceFilters],
			eventCount: this.traceEvents.length,
			events: this.traceEvents.map((e) => ({
				...e,
				collisionChecks: e.collisionChecks.map((e) => ({ ...e }))
			}))
		};
	}
	setTimelineControl(e) {
		for (let t of this.bones) t.stiffnessForce = yi(e.stiffnessForce, t.originalStiffnessForce), t.dragForce = yi(e.dragForce, t.originalDragForce), t.windInfluence = yi(e.windInfluence, t.originalWindInfluence), t.slowMotionScale = yi(e.slowMotionScale, 1), t.isPaused = e.paused ?? !1;
	}
	clearTimelineControl() {
		this.setTimelineControl({});
	}
	update(e) {
		this.bones.some((e) => e.automaticUpdates && e.enabled && !e.isPaused) && this.preUpdateColliders();
		let t = this.collectWindVolumeOneSelfProviders(), n = new Set(t.filter((e) => e.isActive && e.springManagerPathId !== null).map((e) => e.springManagerPathId)), r = new Set(t.filter((e) => !e.isActive && e.springManagerPathId !== null).map((e) => e.springManagerPathId));
		for (let t of this.bones) if (!(!t.automaticUpdates || !t.enabled)) {
			if (t.node.parent?.getWorldQuaternion(this.parentRotation), t.node.getWorldPosition(this.headPosition), t.isPaused) {
				this.applyBoneRotation(t, Zr(t));
				continue;
			}
			!(t.managerPathId !== null && r.has(t.managerPathId) || t.isSumOfForcesOnBone) || t.managerPathId !== null && n.has(t.managerPathId) || (this.computeExternalForce(t, e), this.updateBoneSpringAndRotation(t, ti(e, t.simulationFrameRate, t.slowMotionScale), this.externalForce, Zr(t)));
		}
		for (let n of t) n.isActive && this.updateWindVolumeOneSelfLateUpdate(n, e);
	}
	collectWindVolumeOneSelfProviders() {
		let e = /* @__PURE__ */ new Set();
		for (let t of this.bones) for (let n of t.forceProviders) n.kind === "WindVolumeOneSelf" && e.add(n);
		return [...e];
	}
	updateWindVolumeOneSelfLateUpdate(e, t) {
		if (e.springManagerPathId === null) return;
		let n = e.simulationFrameRate > 0 ? 1 / e.simulationFrameRate : t;
		for (let r of this.bones) r.managerPathId !== e.springManagerPathId || !r.automaticUpdates || !r.enabled || r.isPaused || (this.computeWindVolumeOneSelfForce(e, r, t), this.externalForce.copy(r.gravity).add(this.providerForce), this.updateBoneSpringAndRotation(r, n, this.externalForce, r.isAnimated ? e.dynamicRatio : 1));
	}
	computeExternalForce(e, t) {
		this.externalForce.copy(e.gravity);
		for (let n of e.forceProviders) this.externalForce.add(this.computeForceProvider(n, e, t));
		return this.externalForce;
	}
	computeForceProvider(e, t, n) {
		return e.kind === "ForceVolume" ? (e.node.updateMatrixWorld(!0), this.providerForce.set(0, 0, 1).transformDirection(e.node.matrixWorld).multiplyScalar(e.strength)) : e.kind === "WindVolume" ? this.computeWindVolume(e, t) : this.computeWindVolumeOneSelfForce(e, t, n);
	}
	computeWindVolume(e, t) {
		let n = e.weight * e.strength;
		if (n <= ir || e.period <= .001) return this.providerForce.set(0, 0, 0);
		e.node.updateMatrixWorld(!0), t.node.getWorldPosition(this.localBonePosition).applyMatrix4(this.providerWorldToLocal.copy(e.node.matrixWorld).invert());
		let r = -this.localBonePosition.x, i = Math.sin(e.timeFactor + Math.sin(r * e.positionalMultiplier) + Math.cos(this.localBonePosition.z * e.positionalMultiplier));
		return this.providerForce.set(0, 0, 1).transformDirection(e.node.matrixWorld).addScaledVector(e.offsetVector, i).normalize().multiplyScalar(n * t.windInfluence);
	}
	computeWindVolumeOneSelfForce(t, n, r) {
		let i = t.weight * t.strength;
		if (i <= ir || t.period <= ir) return this.providerForce.set(0, 0, 0);
		t.currentTime = vi(t.currentTime, r, t.period);
		let a = t.currentTime * Math.PI * 2 / t.period;
		if (t.node.updateMatrixWorld(!0), this.waveAxis.set(0, 1, 0).transformDirection(t.node.matrixWorld), Math.abs(t.spinPeriod) > .001) {
			t.spinTime = vi(t.spinTime, r, t.spinPeriod);
			let e = t.spinTime * Math.PI * 2 / t.spinPeriod;
			this.providerRight.copy(ar).transformDirection(t.node.matrixWorld), this.providerUp.set(0, 1, 0).transformDirection(t.node.matrixWorld), this.waveAxis.copy(this.providerRight).multiplyScalar(Math.cos(e)).addScaledVector(this.providerUp, Math.sin(e));
		}
		let o = Math.max(t.peakDistance, ir);
		n.node.getWorldPosition(this.localBonePosition).applyMatrix4(this.providerWorldToLocal.copy(t.node.matrixWorld).invert());
		let s = Math.PI * 2 / o, c = -this.localBonePosition.x, l = Math.sin(a + Math.sin(s * c) + Math.cos(s * this.localBonePosition.z));
		return this.mainWindDirection.set(0, 0, 1).transformDirection(t.node.matrixWorld).addScaledVector(this.waveAxis, t.amplitude * l).normalize(), this.additionalDirection.set(-Math.cos(e.MathUtils.degToRad(t.additionalWindAngle)), 0, -Math.sin(e.MathUtils.degToRad(t.additionalWindAngle))).normalize(), this.providerForce.copy(this.mainWindDirection).multiplyScalar(i).addScaledVector(this.additionalDirection, t.additionalWindStrength).multiplyScalar(n.windInfluence);
	}
	settleCurrentPose(e = 60, t = 1 / 60) {
		let n = Math.max(0, Math.floor(e));
		for (let e = 0; e < n; e += 1) this.update(t);
	}
	resetPose() {
		for (let e of this.bones) e.node.quaternion.copy(e.initialLocalRotation), e.skinAnimationLocalRotation.copy(e.initialLocalRotation), e.lastAppliedLocalRotation.copy(e.initialLocalRotation), e.hasAppliedLocalRotation = !1, e.node.scale.copy(e.initialLocalScale), e.node.updateMatrix(), e.node.updateMatrixWorld(!0);
	}
	resetStateToCurrentPose() {
		for (let e of this.bones) e.node.parent?.getWorldQuaternion(this.parentRotation), e.node.getWorldPosition(this.headPosition), e.skinAnimationLocalRotation.copy(e.node.quaternion), this.debugAnimatedTip.copy(Tn({
			headPosition: this.headPosition,
			parentRotation: this.parentRotation,
			initialLocalRotation: e.initialLocalRotation,
			boneAxis: e.boneAxis,
			springLength: e.springLength
		})), e.state.currTipPos.copy(this.debugAnimatedTip), e.state.prevTipPos.copy(this.debugAnimatedTip), e.state.cachedPosition.copy(this.headPosition), e.state.cachedMovement.set(0, 0, 0), e.state.hitNormal.set(0, 0, 0), e.lastAppliedLocalRotation.copy(e.node.quaternion), e.hasAppliedLocalRotation = !1;
	}
	getSnapshot(t = !0, n = {}) {
		let r = /* @__PURE__ */ new Set(), i = [], a = [], o = 0, s = 0, c = 0, l = 0;
		for (let t of this.bones) {
			for (let e of t.colliders) r.add(e);
			t.node.parent?.getWorldQuaternion(this.parentRotation), t.node.getWorldPosition(this.headPosition), this.debugAnimatedTip.copy(Tn({
				headPosition: this.headPosition,
				parentRotation: this.parentRotation,
				initialLocalRotation: t.initialLocalRotation,
				boneAxis: t.boneAxis,
				springLength: t.springLength
			}));
			let n = this.debugAnimatedTip.distanceTo(t.state.currTipPos), u = t.node.name.toLowerCase(), d = t.state.currTipPos.clone().sub(this.debugAnimatedTip), f = t.state.currTipPos.clone().sub(t.state.prevTipPos), p = this.skinnedBones.has(t.node);
			u.includes("sleeve") && (o = Math.max(o, n)), u.includes("skirt") && (s = Math.max(s, n)), p ? c += 1 : l += 1, i.push({
				name: t.node.name,
				path: q(t.node),
				springName: t.springName,
				sourceBoneName: t.sourceBoneName,
				sourceBonePath: t.sourceBonePath,
				sourceBonePathId: t.sourceBonePathId,
				resolvedIsSkinnedBone: p,
				pivotSourceName: t.pivotSourceName,
				pivotSourcePath: t.pivotSourcePath,
				pivotResolvedPath: t.pivotResolvedPath,
				tailBinding: li(t.tailBinding),
				offset: n,
				colliderCount: t.colliders.length,
				lastCollisionStatus: t.lastCollisionStatus,
				lastCollisionColliderName: t.lastCollisionInfo?.name ?? null,
				lastCollisionColliderPath: t.lastCollisionInfo?.path ?? null,
				lastCollisionColliderKind: t.lastCollisionInfo?.kind ?? null,
				lastCollisionColliderSourcePathId: t.lastCollisionInfo?.sourcePathId ?? null,
				lastAngleLimitApplied: t.lastAngleLimitApplied,
				hasSpringForce: t.springForce.lengthSq() > 1e-8,
				forceProviderCount: t.forceProviders.length,
				stiffnessForce: t.stiffnessForce,
				managerDynamicRatio: t.dynamicRatio,
				dynamicRatio: Zr(t),
				isAnimated: t.isAnimated,
				automaticUpdates: t.automaticUpdates,
				boneEnabled: t.enabled,
				bonePaused: t.isPaused,
				isSumOfForcesOnBone: t.isSumOfForcesOnBone,
				simulationFrameRate: t.simulationFrameRate,
				slowMotionScale: t.slowMotionScale,
				updateSkipReason: ii(t),
				animatedTipDelta: H(d),
				velocity: H(f),
				springForce: H(t.springForce),
				colliderBindings: t.colliderBindingDiagnostics.map(Kr)
			}), u.includes("skirt") && a.push({
				name: t.node.name,
				path: q(t.node),
				springName: t.springName,
				sourceBoneName: t.sourceBoneName,
				sourceBonePath: t.sourceBonePath,
				sourceBonePathId: t.sourceBonePathId,
				resolvedIsSkinnedBone: p,
				pivotSourceName: t.pivotSourceName,
				pivotSourcePath: t.pivotSourcePath,
				pivotResolvedPath: t.pivotResolvedPath,
				tailBinding: li(t.tailBinding),
				offset: n,
				appliedRotationDegrees: e.MathUtils.radToDeg(t.skinAnimationLocalRotation.angleTo(t.node.quaternion)),
				colliderCount: t.colliders.length,
				lastCollisionStatus: t.lastCollisionStatus,
				lastCollisionColliderName: t.lastCollisionInfo?.name ?? null,
				lastCollisionColliderPath: t.lastCollisionInfo?.path ?? null,
				lastCollisionColliderKind: t.lastCollisionInfo?.kind ?? null,
				lastCollisionColliderSourcePathId: t.lastCollisionInfo?.sourcePathId ?? null,
				lastCollisionHitNormal: t.lastCollisionInfo ? H(t.lastCollisionInfo.hitNormal) : null,
				lastAngleLimitApplied: t.lastAngleLimitApplied,
				hasSpringForce: t.springForce.lengthSq() > 1e-8,
				forceProviderCount: t.forceProviders.length,
				stiffnessForce: t.stiffnessForce,
				dragForce: t.dragForce,
				managerDynamicRatio: t.dynamicRatio,
				dynamicRatio: Zr(t),
				isAnimated: t.isAnimated,
				automaticUpdates: t.automaticUpdates,
				boneEnabled: t.enabled,
				bonePaused: t.isPaused,
				isSumOfForcesOnBone: t.isSumOfForcesOnBone,
				simulationFrameRate: t.simulationFrameRate,
				slowMotionScale: t.slowMotionScale,
				updateSkipReason: ii(t),
				animatedTipDelta: H(d),
				velocity: H(f),
				headMovement: H(t.state.cachedMovement),
				gravity: H(t.gravity),
				springForce: H(t.springForce),
				colliderBindings: t.colliderBindingDiagnostics.map(Kr)
			});
		}
		i.sort((e, t) => t.offset - e.offset), a.sort((e, t) => t.offset - e.offset);
		let u = ri(i, n), d = ur(this.bones, this.skinnedBones);
		return {
			runtimeMode: "unity-prefab",
			enabled: t,
			springCount: new Set(this.bones.map((e) => e.springName)).size,
			boneCount: this.bones.length,
			colliderCount: r.size,
			missingNodeCount: this.missingNodes.length,
			missingNodeSamples: this.missingNodes.slice(0, 96),
			setupDiagnostics: {
				...this.setupDiagnostics,
				activeRoots: [...this.setupDiagnostics.activeRoots]
			},
			maxSleeveOffset: o,
			maxSkirtOffset: s,
			topOffsets: i.slice(0, 8),
			debugOffsets: u,
			controlledPartCounts: d.counts,
			controlledHairSamples: d.hairSamples,
			skirtOffsets: a,
			bindingDiagnostics: this.bones.flatMap((e) => e.colliderBindingDiagnostics).map(Kr),
			skinnedBoneMatches: c,
			skinnedBoneMisses: l
		};
	}
	updateBoneSpringAndRotation(t, n, r, i) {
		t.node.parent?.getWorldQuaternion(this.parentRotation), t.node.getWorldPosition(this.headPosition);
		let a = this.shouldTraceBone(t) ? this.createTraceEvent(t, n, r, i) : null;
		this.captureSkinAnimationLocalRotation(t), a && (a.skinAnimationLocalRotation = oi(t.skinAnimationLocalRotation)), Dn(t.state, this.headPosition), a && (a.stateAfterCache = U(t.state)), En(t.state, {
			headPosition: this.headPosition,
			parentRotation: this.parentRotation,
			initialLocalRotation: t.initialLocalRotation,
			boneAxis: t.boneAxis,
			lengthFallbackDirection: t.boneAxis.clone().applyQuaternion(t.node.getWorldQuaternion(new e.Quaternion())),
			springLength: t.springLength,
			stiffnessForce: t.stiffnessForce,
			dragForce: t.dragForce,
			springForce: t.springForce,
			externalForce: r,
			deltaTime: n
		}), a && (a.stateAfterUpdateSpring = U(t.state)), this.applyLengthLimits(t, n), a && (a.stateAfterLengthLimits = U(t.state));
		let o = Math.abs(t.radius) * Ti(t.node);
		a && (a.tailRadius = o);
		let s = t.collideWithGround ? Nn(t.state, {
			headPosition: this.headPosition,
			springLength: t.springLength,
			tailRadius: o,
			groundHeight: t.groundHeight,
			lengthFallbackDirection: t.boneAxis.clone().applyQuaternion(t.node.getWorldQuaternion(new e.Quaternion())),
			bounce: t.bounce,
			friction: t.friction
		}) : !1;
		a && (a.groundHit = s, a.stateAfterGround = U(t.state)), t.lastCollisionInfo = null;
		let c = [], l = t.enableCollision ? this.buildWorldColliders(t.colliders) : [];
		t.lastCollisionStatus = !s && t.enableCollision ? jn(t.state, {
			headPosition: this.headPosition,
			springLength: t.springLength,
			tailRadius: o,
			colliders: l,
			bounce: t.bounce,
			friction: t.friction,
			onColliderCheck: a ? (e, t) => {
				c.push(ci(e, t));
			} : void 0,
			onCollision: (e, n) => {
				t.lastCollisionInfo = {
					kind: e.kind,
					name: e.debugName ?? null,
					path: e.debugPath ?? null,
					sourcePathId: e.debugSourcePathId ?? null,
					hitNormal: n.hitNormal.clone()
				};
			}
		}) : 0, a && (a.collisionChecks = c, a.collisionStatus = t.lastCollisionStatus, a.stateAfterCollisions = U(t.state));
		let u = a ? si(t) : void 0;
		t.lastAngleLimitApplied = t.enableAngleLimits ? this.applyAngleLimits(t, n, u) : !1, a && u && (a.angleLimit = u, a.stateAfterAngleLimits = U(t.state)), this.resetInvalidTipPosition(t), this.applyBoneRotation(t, i), a && (a.finalLocalRotation = oi(t.node.quaternion), this.pushTraceEvent(a));
	}
	applyLengthLimits(t, n) {
		if (!t.enableLengthLimits || t.lengthLimitTargets.length === 0) return;
		let r = t.lengthLimitTargets.map((t) => ({
			position: t.node.getWorldPosition(new e.Vector3()),
			initialLength: t.initialLength
		}));
		An({
			currTipPos: t.state.currTipPos,
			springConstant: t.springConstant,
			deltaTime: n,
			targets: r
		});
	}
	applyAngleLimits(e, t, n) {
		if (!e.yAngleLimit && !e.zAngleLimit) return !1;
		let r = e.pivotNode ?? e.node.parent ?? e.node;
		r.updateMatrixWorld(!0), this.angleVector.copy(e.state.currTipPos).sub(e.state.cachedPosition);
		let i = or.clone().transformDirection(r.matrixWorld), a = sr.clone().transformDirection(r.matrixWorld), o = cr.clone().transformDirection(r.matrixWorld);
		n && (n.enabled = !0, n.hasPivot = !0, n.pivotName = r.name || null, n.pivotPath = q(r) || null, n.vectorBefore = H(this.angleVector), n.forward = H(i), n.back = H(a), n.down = H(o));
		let s = !1;
		if (e.yAngleLimit) {
			let r = Kn({
				basisSide: o,
				basisUp: a,
				basisForward: i,
				springStrength: e.angularStiffness,
				deltaTime: t,
				limit: e.yAngleLimit,
				vector: this.angleVector
			});
			n && (n.yApplied = r, n.afterY = H(this.angleVector)), s = r || s;
		}
		if (e.zAngleLimit) {
			let r = Kn({
				basisSide: a,
				basisUp: o,
				basisForward: i,
				springStrength: e.angularStiffness,
				deltaTime: t,
				limit: e.zAngleLimit,
				vector: this.angleVector
			});
			n && (n.zApplied = r, n.afterZ = H(this.angleVector)), s = r || s;
		}
		return e.state.currTipPos.copy(e.state.cachedPosition).add(this.angleVector), n && (n.vectorAfter = H(this.angleVector)), s;
	}
	applyBoneRotation(e, t = e.dynamicRatio) {
		this.resetInvalidTipPosition(e), this.localRotation.copy(qn(this.headPosition, e.state.currTipPos, this.parentRotation, e.initialLocalRotation, e.boneAxis)), e.node.quaternion.copy(ki(e.skinAnimationLocalRotation, this.localRotation, t)), e.lastAppliedLocalRotation.copy(e.node.quaternion), e.hasAppliedLocalRotation = !0, e.node.updateMatrix(), e.node.updateMatrixWorld(!0);
	}
	captureSkinAnimationLocalRotation(e) {
		this.skinAnimationLocalRotation.copy(e.node.quaternion), !(e.hasAppliedLocalRotation && Ai(this.skinAnimationLocalRotation, e.lastAppliedLocalRotation)) && e.skinAnimationLocalRotation.copy(this.skinAnimationLocalRotation);
	}
	resetInvalidTipPosition(e) {
		Number.isFinite(e.state.currTipPos.x) && Number.isFinite(e.state.currTipPos.y) && Number.isFinite(e.state.currTipPos.z) || (this.debugAnimatedTip.copy(Tn({
			headPosition: this.headPosition,
			parentRotation: this.parentRotation,
			initialLocalRotation: e.initialLocalRotation,
			boneAxis: e.boneAxis,
			springLength: e.springLength
		})), e.state.currTipPos.copy(this.debugAnimatedTip), e.state.prevTipPos.copy(this.debugAnimatedTip));
	}
	shouldTraceBone(e) {
		if (this.traceFilters.length === 0) return !1;
		let t = e.node.name.toLowerCase(), n = q(e.node).toLowerCase(), r = e.springName.toLowerCase();
		return this.traceFilters.some((e) => t.includes(e) || n.includes(e) || r.includes(e));
	}
	createTraceEvent(e, t, n, r) {
		return {
			sequence: this.traceSequence,
			springName: e.springName,
			boneName: e.node.name,
			bonePath: q(e.node),
			sourceBoneName: e.sourceBoneName,
			sourceBonePath: e.sourceBonePath,
			sourceBonePathId: e.sourceBonePathId,
			pivotSourceName: e.pivotSourceName,
			pivotSourcePath: e.pivotSourcePath,
			pivotResolvedPath: e.pivotResolvedPath,
			tailBinding: li(e.tailBinding),
			managerPathId: e.managerPathId,
			deltaTime: t,
			dynamicRatio: r,
			automaticUpdates: e.automaticUpdates,
			enabled: e.enabled,
			enableCollision: e.enableCollision,
			enableAngleLimits: e.enableAngleLimits,
			enableLengthLimits: e.enableLengthLimits,
			colliderCount: e.colliders.length,
			forceProviderCount: e.forceProviders.length,
			headPosition: H(this.headPosition),
			parentRotation: oi(this.parentRotation),
			initialLocalRotation: oi(e.initialLocalRotation),
			skinAnimationLocalRotation: oi(e.skinAnimationLocalRotation),
			boneAxis: H(e.boneAxis),
			boneAxisSource: e.boneAxisSource,
			springLength: e.springLength,
			radius: e.radius,
			tailRadius: 0,
			stiffnessForce: e.stiffnessForce,
			dragForce: e.dragForce,
			springForce: H(e.springForce),
			gravity: H(e.gravity),
			externalForce: H(n),
			stateBefore: U(e.state),
			stateAfterCache: U(e.state),
			animatedTip: H(Tn({
				headPosition: this.headPosition,
				parentRotation: this.parentRotation,
				initialLocalRotation: e.initialLocalRotation,
				boneAxis: e.boneAxis,
				springLength: e.springLength
			})),
			stateAfterUpdateSpring: U(e.state),
			stateAfterLengthLimits: U(e.state),
			groundHit: !1,
			stateAfterGround: U(e.state),
			collisionStatus: 0,
			collisionChecks: [],
			stateAfterCollisions: U(e.state),
			angleLimit: si(e),
			stateAfterAngleLimits: U(e.state),
			finalLocalRotation: oi(e.node.quaternion)
		};
	}
	pushTraceEvent(e) {
		for (this.traceSequence += 1, this.traceEvents.push({ ...e }); this.traceEvents.length > this.traceMaxEvents;) this.traceEvents.shift();
	}
	buildWorldColliders(e) {
		let t = [];
		for (let n of e) {
			let e = this.frameColliderCache.get(n) ?? this.createWorldCollider(n);
			e && t.push(e);
		}
		return t;
	}
	preUpdateColliders() {
		this.frameColliderCache.clear();
		let e = /* @__PURE__ */ new Set();
		for (let t of this.bones) for (let n of t.colliders) e.add(n);
		let t = [...e].sort((e, t) => Ci(e.source) - Ci(t.source));
		for (let e of t) {
			let t = this.createWorldCollider(e);
			t && this.frameColliderCache.set(e, t);
		}
	}
	createWorldCollider(e) {
		let t = e.source.shape, n = e.source.enabled !== !1, r = n && e.source.linkedRendererEnabled !== !1;
		return t?.sphere ? (e.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(e.node.matrixWorld), this.colliderWorldToLocal.copy(e.node.matrixWorld).invert(), {
			kind: "sphere",
			enabled: n,
			debugName: e.source.nodeName ?? e.source.scriptName ?? e.node.name,
			debugPath: e.source.nodePath ?? q(e.node),
			debugSourcePathId: e.source.pathId,
			localOffset: di(t.sphere.offset),
			radius: Math.max(0, t.sphere.radius ?? .01),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Ei(this.colliderWorldToLocal),
			localToWorldNormalMatrix: Di(this.colliderLocalToWorld),
			lossyScaleX: wi(e.node)
		}) : t?.capsule ? (e.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(e.node.matrixWorld), this.colliderWorldToLocal.copy(e.node.matrixWorld).invert(), {
			kind: "capsuleLocal",
			enabled: r,
			debugName: e.source.nodeName ?? e.source.scriptName ?? e.node.name,
			debugPath: e.source.nodePath ?? q(e.node),
			debugSourcePathId: e.source.pathId,
			localStart: di(t.capsule.offset),
			localEnd: di(t.capsule.tail),
			radius: Math.max(0, t.capsule.radius ?? .01),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Ei(this.colliderWorldToLocal),
			localToWorldNormalMatrix: Di(this.colliderLocalToWorld),
			lossyScaleX: wi(e.node)
		}) : t?.panel ? (e.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(e.node.matrixWorld), this.colliderWorldToLocal.copy(e.node.matrixWorld).invert(), {
			kind: "panel",
			enabled: r,
			debugName: e.source.nodeName ?? e.source.scriptName ?? e.node.name,
			debugPath: e.source.nodePath ?? q(e.node),
			debugSourcePathId: e.source.pathId,
			width: Math.max(0, t.panel.width ?? 0),
			height: Math.max(0, t.panel.height ?? 0),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Ei(this.colliderWorldToLocal),
			worldToLocalLengthScale: Ei(this.colliderWorldToLocal),
			localToWorldNormalMatrix: Di(this.colliderLocalToWorld)
		}) : null;
	}
};
function ur(e, t) {
	let n = /* @__PURE__ */ new Map(), r = [];
	for (let i of e) {
		let e = ui(i.sourceBonePath), a = `${i.runtimePartIndex ?? "null"}|${i.runtimePartType ?? "null"}|${e ?? "null"}`, o = n.get(a);
		o || (o = {
			runtimePartIndex: i.runtimePartIndex,
			runtimePartType: i.runtimePartType,
			sourceRoot: e,
			count: 0,
			sampleNames: [],
			samplePaths: []
		}, n.set(a, o)), o.count += 1, o.sampleNames.length < 6 && (o.sampleNames.push(i.node.name), o.samplePaths.push(q(i.node))), r.length < 12 && (i.runtimePartType === "hair" || i.node.name.toLowerCase().includes("hair") || (i.sourceBonePath ?? "").toLowerCase().includes("hair")) && r.push({
			name: i.node.name,
			path: q(i.node),
			sourceBonePath: i.sourceBonePath,
			runtimePartIndex: i.runtimePartIndex,
			runtimePartType: i.runtimePartType,
			resolvedIsSkinnedBone: t.has(i.node)
		});
	}
	return {
		counts: [...n.values()].sort((e, t) => (e.runtimePartIndex ?? -1) - (t.runtimePartIndex ?? -1) || String(e.runtimePartType ?? "").localeCompare(String(t.runtimePartType ?? "")) || String(e.sourceRoot ?? "").localeCompare(String(t.sourceRoot ?? ""))),
		hairSamples: r
	};
}
function dr(t, n, r, i, a, o, s, c) {
	let l = i.tailPosition, u = r.getWorldPosition(new e.Vector3()), d = l.clone().sub(u).length(), f = r.quaternion.clone(), p = fi(r, l), m = e.MathUtils.clamp(K(t.dynamicRatio) ?? .5, 0, 1), h = o.map((t) => ({
		node: t.node,
		initialLength: t.node.getWorldPosition(new e.Vector3()).distanceTo(l)
	})), g = n.rawStiffnessForce ?? 300, _ = n.rawDragForce ?? n.dragForce ?? .4, v = Math.max(0, n.rawWindInfluence ?? 1), y = K(t.slowMotionScale) ?? 1, b = t.isPaused === !0;
	return {
		managerPathId: K(t.pathId),
		runtimePartIndex: K(n.runtimePartIndex) ?? K(t.runtimePartIndex),
		runtimePartType: n.runtimePartType ?? t.runtimePartType ?? n.partKind ?? t.partKind ?? null,
		springName: `${t.partKind ?? n.partKind ?? "Part"}:${t.nodeName ?? t.pathId ?? "manager"}`,
		sourceBoneName: n.nodeName ?? null,
		sourceBonePath: n.nodePath ?? null,
		sourceBonePathId: K(n.pathId),
		pivotSourceName: n.pivotNodeName ?? null,
		pivotSourcePath: n.pivotNodePath ?? null,
		pivotResolvedPath: a ? q(a) : null,
		tailBinding: i,
		automaticUpdates: t.automaticUpdates !== !1,
		enabled: t.enabled !== !1 && n.enabled !== !1,
		enableLengthLimits: t.enableLengthLimits !== !1,
		enableAngleLimits: t.enableAngleLimits !== !1,
		enableCollision: t.enableCollision !== !1,
		collideWithGround: t.collideWithGround === !0,
		groundHeight: t.groundHeight ?? 0,
		isSumOfForcesOnBone: t.isSumOfForcesOnBone !== !1,
		isPaused: b,
		gravity: di(t.rawGravity),
		forceProviders: s,
		node: r,
		state: wn(u, l),
		initialLocalRotation: f,
		initialLocalScale: r.scale.clone(),
		skinAnimationLocalRotation: f.clone(),
		lastAppliedLocalRotation: f.clone(),
		hasAppliedLocalRotation: !1,
		boneAxis: p.axis,
		boneAxisSource: p.source,
		springLength: d,
		dynamicRatio: m,
		isAnimated: Qr(n, r, t),
		simulationFrameRate: K(t.simulationFrameRate) ?? 60,
		slowMotionScale: y,
		bounce: K(t.bounce) ?? 0,
		friction: K(t.friction) ?? 1,
		radius: Math.max(0, n.hitRadius ?? .05),
		stiffnessForce: g,
		dragForce: _,
		windInfluence: v,
		originalStiffnessForce: g,
		originalDragForce: _,
		originalWindInfluence: v,
		springForce: di(n.rawSpringForce),
		springConstant: n.rawSpringConstant ?? .5,
		lengthLimitTargets: h,
		angularStiffness: Math.max(0, n.rawAngularStiffness ?? 100),
		pivotNode: a,
		yAngleLimit: Xr(n.rawAngleLimits?.y),
		zAngleLimit: Xr(n.rawAngleLimits?.z),
		colliders: c.colliders,
		colliderBindingDiagnostics: c.diagnostics,
		lastCollisionStatus: 0,
		lastCollisionInfo: null,
		lastAngleLimitApplied: !1
	};
}
function fr(e, t, n) {
	return (t.forceProviders ?? []).map((t) => {
		let r = pr(t), i = r ? n.get(r) : void 0;
		if (i) return i;
		let a = mr(e, t);
		return a && r && n.set(r, a), a;
	}).filter((e) => !!e);
}
function pr(e) {
	let t = typeof e.runtimePartIndex == "number" ? `${e.runtimePartIndex}:` : "";
	return typeof e.sourcePathId == "number" ? `${t}path:${e.sourcePathId}` : e.nodePath ? `${t}nodePath:${e.nodePath}` : null;
}
function mr(t, n) {
	let r = n.scriptName ?? "", i = r.endsWith("WindVolumeOneSelf"), a = r.endsWith("WindVolume") && !i, o = r.endsWith("ForceVolume") && !a;
	if (!o && !a && !i) return null;
	let s = V(t, n.nodePath, n.runtimePartIndex) ?? hr(t, n.nodeName), c = n.raw ?? {};
	if (!s || !hi(c, "m_Enabled", !0) || n.activeSelf === !1 || n.activeInHierarchy === !1) return null;
	let l = {
		sourcePathId: K(n.sourcePathId),
		node: s,
		springManagerPathId: K(n.springManagerPathId) ?? gi(c, "<SpringManager>k__BackingField") ?? gi(c, "_SpringManager_k__BackingField") ?? gi(c, "springManager")
	};
	return o ? {
		kind: "ForceVolume",
		...l,
		strength: G(c, "strength", 0)
	} : a ? {
		kind: "WindVolume",
		...l,
		weight: G(c, "weight", 0),
		strength: G(c, "strength", 0),
		period: G(c, "period", 0),
		positionalMultiplier: G(c, "positionalMultiplier", 0),
		timeFactor: G(c, "timeFactor", 0),
		offsetVector: mi(c, "offsetVector")
	} : {
		kind: "WindVolumeOneSelf",
		...l,
		isActive: hi(c, "isActive", !1),
		dynamicRatio: e.MathUtils.clamp(G(c, "dynamicRatio", .5), 0, 1),
		simulationFrameRate: Math.max(0, G(c, "simulationFrameRate", 60)),
		weight: G(c, "weight", 0),
		strength: G(c, "strength", 0),
		period: G(c, "period", 0),
		currentTime: G(c, "currentTime", 0),
		spinPeriod: G(c, "spinPeriod", 0),
		spinTime: G(c, "spinTime", 0),
		amplitude: G(c, "amplitude", 0),
		peakDistance: G(c, "peakDistance", 0),
		additionalWindAngle: G(c, "additionalWindAngle", 0),
		additionalWindStrength: G(c, "additionalWindStrength", 0)
	};
}
function hr(e, t) {
	if (!t) return null;
	let n = [...new Set(e.nodeByPath.values())].filter((e) => e.name === t);
	return n.length === 1 ? n[0] : null;
}
function gr(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let a of e.colliders ?? []) {
		if (typeof a.index != "number" || !zr(a.nodePath, r)) continue;
		let e = V(t, a.nodePath, a.runtimePartIndex);
		if (!e) {
			n.push(a.nodePath ?? a.nodeName ?? `collider:${a.index}`);
			continue;
		}
		i.set(a.index, {
			source: a,
			node: e
		});
	}
	return i;
}
function _r(e, t, n) {
	return {
		managerCount: e.managers?.length ?? 0,
		boneSourceCount: e.bones?.length ?? 0,
		colliderSourceCount: e.colliders?.length ?? 0,
		bindingDecisionCount: e.bindingDecisions?.length ?? 0,
		managerColliderCacheCount: e.managerColliderCaches?.length ?? 0,
		officialSpringComponentCount: n.pathIds.size,
		rejectedUnverifiedBoneSourceCount: 0,
		activeRootCount: t.size,
		activeRoots: [...t].sort()
	};
}
function vr(e) {
	let t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), r = !1;
	for (let i of e.prefabGraphs ?? []) {
		Array.isArray(i.monoBehaviours) && (r = !0);
		for (let e of i.monoBehaviours ?? []) yr(e.scriptName) && (typeof e.pathId == "number" && t.add(e.pathId), e.transformPath && n.add(Ar(e.runtimePartIndex ?? -1, e.transformPath)));
	}
	return {
		hasComponentMetadata: r,
		pathIds: t,
		partPaths: n
	};
}
function yr(e) {
	let t = e?.trim().toLowerCase();
	return t === "springbone" || t === "sekaispringbone";
}
function br(e, t) {
	return !t.hasComponentMetadata || typeof e.pathId == "number" && t.pathIds.has(e.pathId) ? !0 : !!(e.nodePath && t.partPaths.has(Ar(e.runtimePartIndex ?? -1, e.nodePath)));
}
function xr(e, t, n, r, i, a, o) {
	if (!r && !i) return {
		colliders: [],
		diagnostics: a ? [Gr(t, n, r, i, null, null, null, `no per-bone collider binding; manager cache not used as fallback; ${Yr(a)}`, [])] : []
	};
	let s = i?.sourceKind ?? r?.sourceKind ?? "direct", c = Vr(i?.candidateRoots ?? r?.collidersByRoot, o);
	if (s === "colliderFlag" && c.size > 0) {
		let o = Ur(c, a), s = Wr(e, t, n, i, r, o), l = s.root ? o.get(s.root) ?? [] : [];
		return {
			colliders: l,
			diagnostics: [Gr(t, n, r, i, c, i?.defaultRoot ?? r?.defaultRoot, s.root, `${s.reason}; manager cache constrained; ${Yr(a)}`, l)]
		};
	}
	let l = qr((i?.selectedColliderIndexes ?? r?.colliders ?? []).map((e) => o.get(e)).filter((e) => !!e), t, n);
	return {
		colliders: l,
		diagnostics: [Gr(t, n, r, i, null, i?.defaultRoot ?? r?.defaultRoot, null, `${i?.selectedColliderIndexes ? "bindingDecision.selectedColliderIndexes" : r?.colliders ? "colliderBinding.colliders" : "no direct collider indexes"} / direct serialized collider references / pose root preference; ${Yr(a)}`, l)]
	};
}
function Sr(t, n, r, i) {
	n.updateMatrixWorld(!0);
	let a = n.getWorldPosition(new e.Vector3()), o = rr("right").transformDirection(n.matrixWorld), s = a.clone().addScaledVector(o, -.1), c = t.nodePath ? kr(r, t.nodePath, t.runtimePartIndex) : void 0, l = c ? wr(c, r, i, t.runtimePartIndex) : [], u = l.map((e) => e.source.name ?? e.node.name), d = l.map((e) => e.source.transformPath ?? q(e.node));
	if (l.length === 0) return {
		mode: "fallback",
		childCount: 0,
		childNames: u,
		childPaths: d,
		childSources: [],
		tailPosition: s
	};
	if (l.length === 1) return {
		mode: "singleChild",
		childCount: 1,
		childNames: u,
		childPaths: d,
		childSources: l.map((e) => e.source),
		tailPosition: l[0].node.getWorldPosition(new e.Vector3())
	};
	let f = new e.Vector3(), p = 0;
	for (let t of l) {
		let n = t.node.getWorldPosition(new e.Vector3());
		f.add(n), p += n.distanceTo(a);
	}
	f.multiplyScalar(1 / l.length), p /= l.length;
	let m = Cr(a, f, p);
	return {
		mode: "averageChildren",
		childCount: l.length,
		childNames: u,
		childPaths: d,
		childSources: l.map((e) => e.source),
		tailPosition: m
	};
}
function Cr(e, t, n) {
	let r = t.clone().sub(e);
	return r.lengthSq() <= 1e-5 * 1e-5 ? r.copy(ar) : r.normalize(), e.clone().addScaledVector(r, n);
}
function wr(e, t, n, r) {
	let i = [];
	for (let a of e.childPathIds ?? []) {
		let e = t.transformByPathId.get(a);
		if (!e || !Tr(e, t)) continue;
		let o = V(n, e.transformPath, r ?? e.runtimePartIndex);
		o && i.push({
			source: e,
			node: o
		});
	}
	return i;
}
function Tr(e, t) {
	return typeof e.pathId == "number" && t.pivotTransformPathIds.has(e.pathId) ? !1 : !e.transformPath || !t.pivotTransformPaths.has(e.transformPath);
}
function Er(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
	for (let i of e.prefabGraphs ?? []) for (let e of i.transforms ?? []) typeof e.pathId == "number" && t.set(e.pathId, e), e.transformPath && (n.set(e.transformPath, e), typeof e.runtimePartIndex == "number" && r.set(Ar(e.runtimePartIndex, e.transformPath), e));
	for (let t of e.prefabGraphs ?? []) for (let e of t.monoBehaviours ?? []) if (e.scriptName?.toLowerCase() === "springbonepivot" && e.transformPath) {
		a.add(e.transformPath);
		let t = n.get(e.transformPath);
		typeof t?.pathId == "number" && i.add(t.pathId);
	}
	return {
		transformByPathId: t,
		transformByPath: n,
		transformByPartPath: r,
		pivotTransformPathIds: i,
		pivotTransformPaths: a
	};
}
function Dr(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
	return e.traverse((i) => {
		let a = q(i, e);
		if (!a) return;
		t.set(a, i);
		let o = xi(i, e);
		o && o !== a && r.set(o, i);
		let s = jr(i), c = i.userData.pjskTransformPath;
		for (let e of typeof c == "string" && c.length > 0 ? [c] : []) typeof s == "number" && n.set(Ar(s, e), i), t.has(e) || t.set(e, i);
	}), {
		nodeByPath: t,
		nodeByPartPath: n,
		canonicalNodeByPath: r
	};
}
function Or(e, t) {
	return t ? e.nodeByPath.get(t) ?? e.canonicalNodeByPath.get(t) ?? null : null;
}
function V(e, t, n) {
	if (!t) return null;
	if (typeof n == "number") {
		let r = e.nodeByPartPath.get(Ar(n, t));
		if (r) return r;
	}
	return Or(e, t);
}
function kr(e, t, n) {
	return typeof n == "number" ? e.transformByPartPath.get(Ar(n, t)) ?? e.transformByPath.get(t) : e.transformByPath.get(t);
}
function Ar(e, t) {
	return `${e}:${t}`;
}
function jr(e) {
	let t = e.userData.pjskRuntimePartIndex;
	return typeof t == "number" ? t : void 0;
}
function Mr(e) {
	let t = /* @__PURE__ */ new Set();
	return e.traverse((e) => {
		let n = e;
		if (n.isSkinnedMesh) for (let e of n.skeleton.bones) t.add(e);
	}), t;
}
function Nr(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.bones ?? []) typeof n.pathId == "number" && t.set(n.pathId, n);
	return t;
}
function Pr(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.colliderBindings ?? []) typeof n.sourceSpringBonePathId == "number" && t.set(n.sourceSpringBonePathId, n);
	return t;
}
function Fr(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.bindingDecisions ?? []) typeof n.sourceSpringBonePathId == "number" && t.set(n.sourceSpringBonePathId, n);
	return t;
}
function Ir(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of e.managerColliderCaches ?? []) {
		if (typeof r.managerPathId != "number") continue;
		let e = /* @__PURE__ */ new Set();
		for (let n of [
			...r.sphereColliderIndexes ?? [],
			...r.capsuleColliderIndexes ?? [],
			...r.panelColliderIndexes ?? []
		]) {
			let i = typeof n == "number" ? t.get(n) : void 0;
			typeof n == "number" && i && Lr(r, i) && e.add(n);
		}
		n.set(r.managerPathId, {
			source: r,
			colliderIndexes: e
		});
	}
	return n;
}
function Lr(e, t) {
	let n = e.managerNodePath ?? "", r = t.source.nodePath ?? "", i = t.source.shape;
	return n.endsWith("/Position/PositionOffset/Hip") ? i?.sphere ? /\/(?:Left_Thigh|Right_Thigh)\/CL_/.test(r) || /\/Hip\/CL_HipSphereCollider$/.test(r) : !1 : !0;
}
function Rr(e) {
	return new Set((e.activeRootProfile?.activeRoots ?? []).map((e) => W(e)).filter((e) => !!e));
}
function zr(e, t) {
	if (t.size === 0) return !0;
	let n = W(ui(e));
	return n !== null && t.has(n);
}
function Br(e, t) {
	let n = [];
	for (let r of t.lengthLimitTargets ?? []) {
		let i = V(e, r.nodePath, r.runtimePartIndex ?? t.runtimePartIndex);
		i && n.push({
			node: i,
			initialLength: 0
		});
	}
	return n;
}
function Vr(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let [r, i] of Object.entries(e ?? {})) {
		let e = i.map((e) => t.get(e)).filter((e) => !!e);
		e.length > 0 && n.set(r, e);
	}
	return n;
}
function Hr(e, t) {
	return !t || t.colliderIndexes.size === 0 ? e : e.filter((e) => typeof e.source.index == "number" && t.colliderIndexes.has(e.source.index));
}
function Ur(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let [r, i] of e.entries()) {
		let e = Hr(i, t);
		e.length > 0 && n.set(r, e);
	}
	return n;
}
function Wr(e, t, n, r, i, a) {
	if (a.size === 1) return {
		root: a.keys().next().value,
		reason: "single manager-cache root"
	};
	let o = W(ui(n.nodePath));
	if (o && a.has(o)) return {
		root: o,
		reason: "joint root matched candidate root"
	};
	if (t.partKind === "Head" || o === "face") {
		let t = W(e.rootSelectionProfile?.defaultBodyRoot ?? e.activeRootProfile?.defaultBodyRoot);
		if (t && a.has(t)) return {
			root: t,
			reason: "head/face uses runtime defaultBodyRoot"
		};
		if (a.has("body")) return {
			root: "body",
			reason: "head/face body fallback"
		};
	}
	let s = W(r?.defaultRoot);
	if (s && a.has(s)) return {
		root: s,
		reason: "bindingDecision.defaultRoot"
	};
	for (let t of e.activeRootProfile?.activeRoots ?? []) {
		let e = W(t);
		if (e && a.has(e)) return {
			root: e,
			reason: "activeRootProfile active root"
		};
	}
	let c = W(i?.defaultRoot);
	return c && a.has(c) ? {
		root: c,
		reason: "binding.defaultRoot"
	} : {
		root: null,
		reason: c ? `binding.defaultRoot ${c} not available after manager cache` : "no matching root"
	};
}
function Gr(e, t, n, r, i, a, o, s, c) {
	return {
		sourceKind: r?.sourceKind ?? n?.sourceKind ?? "direct",
		colliderFlag: r?.colliderFlag ?? n?.colliderFlag ?? null,
		colliderGroupIndex: null,
		springName: `${e.partKind ?? t.partKind ?? "Part"}:${e.nodeName ?? e.pathId ?? "manager"}`,
		boneName: t.nodeName ?? null,
		bonePath: t.nodePath ?? null,
		sourceSpringBonePathId: K(t.pathId),
		candidateRoots: i ? [...i.entries()].map(([e, t]) => ({
			root: e,
			colliderCount: t.length,
			colliderSourcePathIds: t.map((e) => e.source.pathId).filter((e) => typeof e == "number")
		})) : [],
		defaultRoot: W(a),
		selectedRoot: o,
		selectedColliderCount: c.length,
		selectedColliderSourcePathIds: c.map((e) => e.source.pathId).filter((e) => typeof e == "number"),
		selectionReason: s
	};
}
function Kr(e) {
	return {
		...e,
		candidateRoots: e.candidateRoots.map((e) => ({
			...e,
			colliderSourcePathIds: [...e.colliderSourcePathIds]
		})),
		selectedColliderSourcePathIds: [...e.selectedColliderSourcePathIds]
	};
}
function qr(e, t, n) {
	let r = Jr(t, n);
	if (!r) return e;
	let i = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = t.source.nodeName ?? t.source.scriptName ?? "", n = i.get(e);
		n ? n.push(t) : i.set(e, [t]);
	}
	return e.filter((e) => {
		let t = e.source.nodeName ?? e.source.scriptName ?? "", n = i.get(t);
		return !n || n.length <= 1 || !n.some((e) => e.source.nodePath?.startsWith(r)) || e.source.nodePath?.startsWith(r);
	});
}
function Jr(e, t) {
	return t.nodePath?.startsWith("sit_body/") ? "sit_body/" : t.nodePath?.startsWith("body/") || e.partKind === "Head" || t.nodePath?.startsWith("face/") ? "body/" : null;
}
function Yr(e) {
	return e ? `${e.source.managerNodeName ?? "manager"} manager cache (${e.source.sphereColliderIndexes?.length ?? 0} sphere, ${e.source.capsuleColliderIndexes?.length ?? 0} capsule, ${e.source.panelColliderIndexes?.length ?? 0} panel)` : "no manager cache available";
}
function Xr(e) {
	return e?.active ? {
		active: !0,
		min: e.min ?? 0,
		max: e.max ?? 0
	} : null;
}
function Zr(e) {
	return e.isAnimated ? e.dynamicRatio : 1;
}
function Qr(e, t, n) {
	let r = ei(n.animatedBoneNames);
	return r.size === 0 ? !1 : $r(t.name, r) || typeof e.nodeName == "string" && $r(e.nodeName, r);
}
function $r(e, t) {
	if (t.has(e)) return !0;
	for (let n of t) if (n.length > 0 && e.includes(n)) return !0;
	return !1;
}
function ei(e) {
	return Array.isArray(e) ? new Set(e.filter((e) => typeof e == "string")) : /* @__PURE__ */ new Set();
}
function ti(e, t, n) {
	let r = t > 0 ? 1 / t : e;
	return n === 1 ? r : r * n;
}
function ni(e) {
	let t = bi(e), n = bi(t?.pjskSpringBone ?? t?.PjskSpringBone), r = bi(n?.runtimeUnitySetup ?? n?.RuntimeUnitySetup), i = r?.version;
	return i === "0414" || i === 414 ? r : null;
}
function H(e) {
	return {
		x: e.x,
		y: e.y,
		z: e.z,
		length: e.length()
	};
}
function ri(e, t) {
	if (t.springDebugAllOffsets) return e;
	let n = (t.springDebugBones ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean);
	return n.length === 0 ? [] : e.filter((e) => {
		let t = [
			e.name,
			e.path,
			e.springName,
			e.sourceBoneName,
			e.sourceBonePath,
			e.pivotSourceName,
			e.pivotSourcePath,
			e.pivotResolvedPath
		].filter((e) => typeof e == "string").join("\n").toLowerCase();
		return n.some((e) => t.includes(e));
	});
}
function ii(e) {
	return e.automaticUpdates ? e.enabled ? e.isPaused ? "isPaused=true" : e.isSumOfForcesOnBone ? null : "isSumOfForcesOnBone=false" : "enabled=false" : "automaticUpdates=false";
}
function ai(e) {
	return e ? H(e) : null;
}
function oi(e) {
	return {
		x: e.x,
		y: e.y,
		z: e.z,
		w: e.w
	};
}
function U(e) {
	return {
		currTipPos: H(e.currTipPos),
		prevTipPos: H(e.prevTipPos),
		hitNormal: H(e.hitNormal),
		cachedPosition: H(e.cachedPosition),
		cachedMovement: H(e.cachedMovement)
	};
}
function si(e) {
	return {
		enabled: e.enableAngleLimits,
		hasPivot: !!e.pivotNode,
		pivotName: e.pivotNode?.name || null,
		pivotPath: e.pivotNode && q(e.pivotNode) || null,
		vectorBefore: null,
		forward: null,
		back: null,
		down: null,
		yApplied: !1,
		zApplied: !1,
		afterY: null,
		afterZ: null,
		vectorAfter: null
	};
}
function ci(e, t) {
	return {
		kind: e.kind,
		name: e.debugName ?? null,
		path: e.debugPath ?? null,
		sourcePathId: e.debugSourcePathId ?? null,
		enabled: e.enabled !== !1,
		status: t.status,
		beforeTailPosition: H(t.beforeTailPosition),
		afterTailPosition: H(t.afterTailPosition),
		hitNormal: H(t.hitNormal),
		localHeadPosition: ai(t.details.localHeadPosition),
		localTailPositionBefore: ai(t.details.localTailPositionBefore),
		localTailPositionAfter: ai(t.details.localTailPositionAfter),
		localTailRadius: t.details.localTailRadius ?? null,
		localSphereOrigin: ai(t.details.localSphereOrigin),
		localSphereRadius: t.details.localSphereRadius ?? null,
		localCapsuleStart: ai(t.details.localCapsuleStart),
		localCapsuleEnd: ai(t.details.localCapsuleEnd),
		capsuleRadius: t.details.capsuleRadius ?? null,
		panelWidth: t.details.panelWidth ?? null,
		panelHeight: t.details.panelHeight ?? null
	};
}
function li(e) {
	return {
		mode: e.mode,
		childCount: e.childCount,
		childNames: [...e.childNames],
		childPaths: [...e.childPaths],
		tailPosition: H(e.tailPosition)
	};
}
function ui(e) {
	if (!e) return null;
	let t = e.indexOf("/");
	return t < 0 ? e : e.slice(0, t);
}
function W(e) {
	return e ? e.endsWith("/") ? e.slice(0, -1) : e : null;
}
function di(t) {
	return tr(Array.isArray(t) ? new e.Vector3(t[0] ?? 0, t[1] ?? 0, t[2] ?? 0) : z(t, new e.Vector3()));
}
function fi(e, t) {
	e.updateMatrixWorld(!0);
	let n = pi(e.worldToLocal(t.clone()));
	return n ? {
		axis: n,
		source: "computed-local-tip"
	} : {
		axis: ar.clone(),
		source: "fallback-local-tip"
	};
}
function pi(e) {
	return e.lengthSq() <= 1e-5 * 1e-5 ? null : e.clone().normalize();
}
function G(e, t, n) {
	return K(e[t] ?? e[_i(t)]) ?? n;
}
function mi(t, n) {
	let r = t[n] ?? t[_i(n)];
	return Array.isArray(r) || typeof r == "object" && r ? di(r) : new e.Vector3();
}
function hi(e, t, n) {
	let r = e[t] ?? e[_i(t)];
	return typeof r == "boolean" ? r : typeof r == "number" ? r !== 0 : n;
}
function gi(e, t) {
	let n = bi(e[t] ?? e[_i(t)]);
	return K(n?.m_PathID ?? n?.m_pathID ?? n?.pathId);
}
function _i(e) {
	return e.length > 0 ? e[0].toUpperCase() + e.slice(1) : e;
}
function vi(t, n, r) {
	return r > 0 ? e.MathUtils.euclideanModulo(t + n, r) : t + n;
}
function yi(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function K(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function bi(e) {
	return e && typeof e == "object" ? e : null;
}
function q(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(r.name), r = r.parent;
	return n.join("/");
}
function xi(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(Si(r.name)), r = r.parent;
	return n.join("/");
}
function Si(e) {
	return e.replace(/_([1-9]\d*)$/, "");
}
function Ci(e) {
	return e.shape?.sphere ? 0 : e.shape?.capsule ? 1 : 2;
}
function wi(t) {
	return t.getWorldScale(new e.Vector3()).x;
}
function Ti(e) {
	let t = e.matrixWorld.elements;
	return Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]);
}
function Ei(e) {
	let t = e.elements;
	return Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]);
}
function Di(e) {
	let t = e.clone();
	return t.setPosition(0, 0, 0), t.invert().transpose();
}
function Oi(e) {
	let t = 0, n = e;
	for (; n;) t += 1, n = n.parent;
	return t;
}
function ki(t, n, r) {
	let i = e.MathUtils.clamp(r, 0, 1), a = n.x, o = n.y, s = n.z, c = n.w;
	return t.dot(n) < 0 && (a = -a, o = -o, s = -s, c = -c), new e.Quaternion(t.x + (a - t.x) * i, t.y + (o - t.y) * i, t.z + (s - t.z) * i, t.w + (c - t.w) * i).normalize();
}
function Ai(e, t) {
	return Math.abs(e.x - t.x) < 1e-6 && Math.abs(e.y - t.y) < 1e-6 && Math.abs(e.z - t.z) < 1e-6 && Math.abs(e.w - t.w) < 1e-6;
}
//#endregion
//#region src/kernel/renderRecipe.ts
function ji(e) {
	let t = String(e.roleId ?? "").trim();
	if (!/^\d+(?::[A-Za-z0-9_/-]+)?$/.test(t)) throw Error("roleId must be '<characterId>:<unit>' or '<characterId>'.");
	let n = (t) => {
		let n = e[t];
		if (!Number.isInteger(n) || Number(n) <= 0) throw Error(`${t} must be a positive integer.`);
		return Number(n);
	}, r = e.headPackagePath, i = r == null ? null : String(r).trim();
	if (i !== null && (i.length === 0 || i.length > 1024 || i.includes("\0"))) throw Error("headPackagePath must be null or a non-empty string of at most 1024 characters without NUL bytes.");
	let a = e.headOptionalCostume3dId == null ? null : n("headOptionalCostume3dId");
	return {
		roleId: t,
		bodyCostume3dId: n("bodyCostume3dId"),
		headCostume3dId: n("headCostume3dId"),
		headPackagePath: i,
		hairCostume3dId: n("hairCostume3dId"),
		headOptionalCostume3dId: a
	};
}
//#endregion
//#region src/engine/prefabNodeLookup.ts
function Mi(e) {
	let t = /* @__PURE__ */ new Map();
	return e.traverse((n) => {
		if (n === e || !n.name) return;
		let r = [], i = [], a = n;
		for (; a && a !== e;) a.name && (r.push(a.name), i.push(a.name.replace(/_\d+$/, ""))), a = a.parent;
		r.reverse(), i.reverse();
		for (let e = 0; e < r.length; e += 1) {
			let a = r.slice(e).join("/");
			a && t.set(a, n);
			let o = i.slice(e).join("/");
			o && t.set(o, n);
		}
	}), t;
}
//#endregion
//#region src/engine/unityConstraintRuntime.ts
var Ni = new e.Vector3(), Pi = new e.Quaternion(), Fi = new e.Vector3(), J = new e.Vector3(), Ii = new e.Quaternion(), Li = new e.Quaternion(), Y = new e.Vector3(), Ri = new e.Vector3(), zi = new e.Vector3(0, 1, 0), Bi = 7, Vi = class {
	graph;
	setup;
	constraints;
	constructor(e, t, n) {
		this.graph = e, this.setup = t, e.root.updateMatrixWorld(!0);
		let r = Array.isArray(t.constraints) ? t.constraints : [];
		this.constraints = r.map((t) => Wi(e, t, n));
	}
	update() {
		this.graph.root.updateMatrixWorld(!0);
		let e = this.constraints.map(Gi);
		return this.graph.root.updateMatrixWorld(!0), Ui(this.setup, e);
	}
};
function Hi(e, t, n) {
	if (!t) return null;
	let r = Array.isArray(t.constraints) ? t.constraints : [];
	e.root.updateMatrixWorld(!0);
	let i = r.map((t) => Wi(e, t, n)).map(Gi);
	return e.root.updateMatrixWorld(!0), Ui(t, i);
}
function Ui(e, t) {
	let n = t.filter((e) => e.resolvedOwner && e.sources.length > 0 && e.sources.every((e) => e.resolvedSource)).length;
	return {
		version: e.version ?? null,
		sourceKind: e.sourceKind ?? null,
		constraintCount: t.length,
		resolvedCount: n,
		unresolvedCount: t.length - n,
		appliedCount: t.filter((e) => e.applied).length,
		warnings: Array.isArray(e.warnings) ? e.warnings.filter((e) => typeof e == "string") : [],
		constraints: t
	};
}
function Wi(e, t, n) {
	let r = X(t.type) ?? "unknown", i = X(t.ownerPath), a = X(t.ownerName), o = Xi(e, i, a), s = Xi(e, X(t.worldUpObjectPath), X(t.worldUpObjectName)).node, c = (Array.isArray(t.sources) ? t.sources : []).map((t) => qi(e, t, n));
	return {
		source: t,
		type: r,
		ownerPath: i,
		ownerName: a,
		owner: o,
		worldUpObject: s,
		sources: c,
		sourceDebug: c.map((e) => e.debug)
	};
}
function Gi(t) {
	let { source: n, type: r, ownerPath: i, ownerName: a, owner: o, worldUpObject: s, sources: c, sourceDebug: l } = t, u = (e, t) => ({
		type: r,
		status: e,
		reason: t,
		ownerPath: i,
		ownerName: a,
		resolvedOwner: !!o.node,
		applied: !1,
		sources: l
	});
	if (n.enabled === !1 || n.active === !1) return u("skipped", "constraint component is disabled");
	if (!o.node) return u("unresolved", o.reason);
	if (c.length === 0) return u("unresolved", "constraint has no source transforms");
	let d = c.find((e) => !e.node);
	if (d) return u("unresolved", d.debug.sourceName ? `source transform ${d.debug.sourceName} was not uniquely resolved` : "constraint source transform was not resolved");
	let f = c.filter(Yi), p = o.node.position.clone(), m = o.node.quaternion.clone();
	if (r === "parent") return Zi(o.node, f) ? (na(o.node, n, p, m, !0, !0), Ki(r, i, a, l, "parent constraint applied with height-scaled translation offsets")) : u("skipped", "parent constraint has no positive source weight");
	if (r === "rotation") return Qi(o.node, f, n.rotationOffset) ? (na(o.node, n, p, m, !1, !0), Ki(r, i, a, l, "rotation constraint applied with weighted source rotations")) : u("skipped", "rotation constraint has no positive source weight");
	if (r === "aim") {
		let t = da(n.aimVector, new e.Vector3(0, 0, 1)), c = da(n.upVector, new e.Vector3(0, 1, 0)), d = ea(o.node, s, n.worldUpType, n.worldUpVector);
		return $i(o.node, f, t, c, d, n.rotationOffset) ? (na(o.node, n, p, m, !1, !0), Ki(r, i, a, l, "aim constraint applied with exported aim/up vectors")) : u("skipped", "aim constraint target direction or source weight was invalid");
	}
	return u("skipped", `unsupported constraint type ${r}`);
}
function Ki(e, t, n, r, i) {
	return {
		type: e,
		status: "applied",
		reason: i,
		ownerPath: t,
		ownerName: n,
		resolvedOwner: !0,
		applied: !0,
		sources: r
	};
}
function qi(e, t, n) {
	let r = X(t.sourcePath), i = X(t.sourceName), a = Ji(e, r, i), o = ha(t.weight) ?? 1, s = la(t.translationOffset, n), c = ua(t.rotationOffset);
	return {
		node: a.node,
		weight: o,
		translationOffset: s,
		rotationOffset: c,
		debug: {
			sourcePath: r,
			sourceName: i,
			weight: o,
			resolvedSource: !!a.node,
			translationOffset: s ? {
				x: s.x,
				y: s.y,
				z: s.z
			} : null,
			rotationOffset: c ? {
				x: c.x,
				y: c.y,
				z: c.z
			} : null
		}
	};
}
function Ji(e, t, n) {
	if (n) {
		let t = null;
		if (e.root.traverse((e) => {
			!t && e.name === n && (t = e);
		}), t) return {
			node: t,
			reason: "rebound by transform name in the combined model"
		};
	}
	return Xi(e, t, n);
}
function Yi(e) {
	return !!e.node;
}
function Xi(e, t, n) {
	if (t) {
		let n = e.nodeByPath.get(t);
		if (n) return {
			node: n,
			reason: "resolved by transform path"
		};
	}
	if (!n) return {
		node: null,
		reason: "constraint transform path and name are missing"
	};
	let r = [];
	for (let t of e.nodeByPath.values()) t.name === n && r.push(t);
	return r.length === 1 ? {
		node: r[0],
		reason: "resolved by exact transform name"
	} : r.length > 1 ? {
		node: null,
		reason: `transform name ${n} matched ${r.length} nodes`
	} : {
		node: null,
		reason: `transform name ${n} was not found`
	};
}
function Zi(t, n) {
	let r = n.reduce((e, t) => e + Math.max(0, t.weight), 0);
	if (r <= 0) return !1;
	J.set(0, 0, 0);
	let i = null, a = 0;
	for (let t of n) {
		let n = Math.max(0, t.weight);
		if (n <= 0) continue;
		t.node.updateMatrixWorld(!0), t.node.matrixWorld.decompose(Ni, Pi, Fi);
		let o = Ni.clone().add((t.translationOffset ?? new e.Vector3()).clone().applyQuaternion(Pi));
		J.addScaledVector(o, n / r), i = sa(i, ta(Pi, t.rotationOffset), a, n), a += n;
	}
	return i ? (oa(t, J, i), !0) : !1;
}
function Qi(e, t, n) {
	let r = ca(t);
	return r ? (e.getWorldPosition(J), oa(e, J, ta(r, ua(n))), !0) : !1;
}
function $i(t, n, r, i, a, o) {
	let s = n.reduce((e, t) => e + Math.max(0, t.weight), 0);
	if (s <= 0) return !1;
	t.updateMatrixWorld(!0), t.getWorldPosition(J), Y.set(0, 0, 0);
	for (let e of n) {
		let t = Math.max(0, e.weight);
		t <= 0 || (e.node.updateMatrixWorld(!0), e.node.getWorldPosition(Ni), Y.addScaledVector(Ni, t / s));
	}
	if (Y.sub(J), Y.lengthSq() < 1e-6) return !1;
	Y.normalize();
	let c = pa(r, new e.Vector3(0, 0, 1)), l = pa(i, new e.Vector3(0, 1, 0));
	if (Ii.setFromUnitVectors(c, Y), Ri.copy(l).applyQuaternion(Ii), a) {
		let t = pa(a, zi), n = ma(Ri, Y), r = ma(t, Y);
		if (n.lengthSq() > 1e-6 && r.lengthSq() > 1e-6) {
			n.normalize(), r.normalize();
			let t = Math.atan2(Y.dot(new e.Vector3().crossVectors(n, r)), e.MathUtils.clamp(n.dot(r), -1, 1));
			Ii.premultiply(new e.Quaternion().setFromAxisAngle(Y, t));
		}
	}
	return oa(t, J, ta(Ii, ua(o))), !0;
}
function ea(e, t, n, r) {
	switch (ha(n) ?? 0) {
		case 1: return t ? (e.getWorldPosition(J), t.getWorldPosition(Ni), Ni.clone().sub(J)) : zi.clone();
		case 2: return t ? fa(t, da(r, zi)) : da(r, zi);
		case 3: return da(r, zi);
		case 4: return null;
		default: return zi.clone();
	}
}
function ta(e, t) {
	return t ? e.clone().multiply(aa(t)).normalize() : e.clone();
}
function na(t, n, r, i, a, o) {
	let s = e.MathUtils.clamp(ha(n.weight) ?? 1, 0, 1), c = t.position.clone(), l = t.quaternion.clone(), u = la(n.translationAtRest, 1) ?? r, d = n.rotationAtRest ? aa(ia(n.rotationAtRest)) : i;
	if (a) {
		let e = ha(n.translationAxis) ?? Bi, r = u.clone().lerp(c, s);
		t.position.set(ra(e, 1) ? r.x : u.x, ra(e, 2) ? r.y : u.y, ra(e, 4) ? r.z : u.z);
	} else t.position.copy(r);
	if (o) {
		let r = ha(n.rotationAxis) ?? Bi, i = new e.Euler().setFromQuaternion(d, "ZXY"), a = new e.Euler().setFromQuaternion(l, "ZXY"), o = new e.Euler(ra(r, 1) ? a.x : i.x, ra(r, 2) ? a.y : i.y, ra(r, 4) ? a.z : i.z, "ZXY");
		t.quaternion.copy(d).slerp(new e.Quaternion().setFromEuler(o), s).normalize();
	} else t.quaternion.copy(i);
	t.updateMatrix(), t.updateMatrixWorld(!0);
}
function ra(e, t) {
	return (e & t) !== 0;
}
function ia(t) {
	return z(t, new e.Vector3());
}
function aa(t) {
	return nr(new e.Quaternion().setFromEuler(new e.Euler(e.MathUtils.degToRad(t.x), e.MathUtils.degToRad(t.y), e.MathUtils.degToRad(t.z), "ZXY")));
}
function oa(e, t, n) {
	let r = t.clone(), i = n.clone();
	e.parent && (e.parent.updateMatrixWorld(!0), e.parent.worldToLocal(r), e.parent.getWorldQuaternion(Li), i.premultiply(Li.invert())), e.position.copy(r), e.quaternion.copy(i.normalize()), e.updateMatrix(), e.updateMatrixWorld(!0);
}
function sa(e, t, n, r) {
	if (!e) return t.clone();
	let i = t.clone();
	return e.dot(i) < 0 && i.set(-i.x, -i.y, -i.z, -i.w), e.slerp(i, r / (n + r)).normalize();
}
function ca(e) {
	let t = null, n = 0;
	for (let r of e) {
		let e = Math.max(0, r.weight);
		e <= 0 || (r.node.updateMatrixWorld(!0), r.node.getWorldQuaternion(Pi), t = sa(t, Pi, n, e), n += e);
	}
	return t;
}
function la(t, n) {
	return !t || typeof t != "object" ? null : er(z(t, new e.Vector3())).multiplyScalar(n);
}
function ua(t) {
	return !t || typeof t != "object" ? null : z(t, new e.Vector3());
}
function da(e, t) {
	return !e || typeof e != "object" ? t.clone() : tr(z(e, t));
}
function fa(e, t) {
	return e.updateMatrixWorld(!0), e.getWorldQuaternion(Ii), t.clone().applyQuaternion(Ii);
}
function pa(e, t) {
	return e.lengthSq() > 1e-6 ? e.clone().normalize() : t.clone().normalize();
}
function ma(e, t) {
	return e.clone().addScaledVector(t, -e.dot(t));
}
function X(e) {
	return typeof e == "string" ? e : null;
}
function ha(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
//#endregion
//#region src/engine/unityPrefabRuntime.ts
function ga(t, n) {
	let r = e.MathUtils.clamp(n || 1, .5, 2), i = t.nodeByPath.get("body/Position");
	if (!i) throw Error("Official CharacterModel PositionNote 'body/Position' was not found.");
	return i.scale.setScalar(r), i.updateMatrix(), t.root.updateMatrixWorld(!0), i;
}
function Z(e) {
	return e && typeof e == "object" ? e : {};
}
function _a(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function va(e) {
	let t = Z(e), n = Z(t.pjskSpringBone ?? t.PjskSpringBone), r = Z(t.runtimeUnitySetup ?? t.RuntimeUnitySetup ?? n.runtimeUnitySetup ?? n.RuntimeUnitySetup), i = r.version;
	return i === "0414" || i === 414 ? r : null;
}
function ya(e) {
	let t = Z(e), n = Z(t.nativeMeshes ?? t.NativeMeshes), r = n.version;
	return r === "0414" || r === 414 ? n : null;
}
function Q(e, t) {
	for (let n of t) {
		if (!n) continue;
		let t = e.get(n);
		if (t) return {
			path: n,
			node: t
		};
	}
	return null;
}
function ba(e) {
	return e?.parentingMode === "model_combine_setup";
}
function xa(e, t) {
	e.parent && e.parent.remove(e), t.add(e), e.updateMatrix();
}
function Sa(e, t) {
	for (; e.children.length > 0;) xa(e.children[0], t);
}
function Ca(e, t, n) {
	let r = [], i = /* @__PURE__ */ new Set();
	for (let a of t) {
		let t = e.get(a);
		t && !i.has(t) && (xa(t, n), i.add(t), r.push(a));
	}
	return r;
}
function wa(e, t, n) {
	e.parent && e.parent.remove(e);
	let r = /* @__PURE__ */ new Set();
	e.traverse((e) => {
		e.userData.pjskModelCombineDestroyed = !0, r.add(e);
	});
	for (let [e, n] of t.entries()) r.has(n) && t.delete(e);
	for (let [e, t] of n.entries()) r.has(t) && n.delete(e);
}
function Ta(e, t, n) {
	for (let [r, i] of e.entries()) i === t && e.set(r, n);
}
function Ea(e, t, n, r, i) {
	let a = r.childMoveSuffix ?? "_target", o = r.parentRootPath, s = r.childRootPath, c = Q(t, [r.parentCombineNodeAPath ?? r.parentAttachPath]), l = Q(t, [r.parentCombineNodeBPath]), u = Q(t, [r.childCombineNodeAPath ?? r.childOriginPath]), d = Q(t, [r.childCombineNodeBPath]), f = Q(t, [s]);
	if (!o || !s || !c || !l || !u || !d || !f) throw Error("Official model_combine_setup paths were not fully resolved.");
	Sa(l.node, d.node);
	let p = c.node.parent, m = u.node.parent;
	if (p && m) {
		for (let e of [...p.children]) e.name.endsWith(a) && xa(e, m);
		let e = Ca(t, i, t.get(o) ?? p), n = i.filter((t) => !e.includes(t));
		if (n.length > 0) throw Error(`Official model_combine_setup head renderers were not moved: ${n.join(", ")}.`);
		let c = `${s}/${r.faceRendererName ?? "Face"}`;
		if (!e.includes(c)) throw Error(`Official model_combine_setup face renderer '${c}' was not moved.`);
		xa(u.node, p);
	}
	return u.node.position.copy(c.node.position), u.node.quaternion.copy(c.node.quaternion), u.node.scale.copy(c.node.scale), u.node.updateMatrix(), d.node.position.copy(l.node.position), d.node.quaternion.copy(l.node.quaternion), d.node.scale.copy(l.node.scale), d.node.updateMatrix(), Ta(n, c.node, u.node), Ta(n, l.node, d.node), wa(l.node, t, n), wa(c.node, t, n), wa(f.node, t, n), t.set(c.path, u.node), t.set(l.path, d.node), r.parentAttachPath && t.set(r.parentAttachPath, u.node), r.parentCombineNodeBPath && t.set(r.parentCombineNodeBPath, d.node), e.updateMatrixWorld(!0), {
		bodyNodeA: c,
		bodyNodeB: l,
		faceNodeA: u,
		faceNodeB: d
	};
}
function Da(e, t) {
	return [...new Set((ya(e)?.meshes ?? []).map((e) => e.rendererTransformPath).filter((e) => typeof e == "string" && e.startsWith(`${t}/`)))];
}
function Oa(e, t) {
	return (ya(e)?.meshes ?? []).find((e) => e.rendererTransformPath?.startsWith(`${t}/`) && typeof e.rootBonePath == "string")?.rootBonePath ?? null;
}
function ka(e, t) {
	let n = e, r = /* @__PURE__ */ new Set();
	for (; typeof n.parentPathId == "number";) {
		if (typeof n.pathId == "number" && !r.add(n.pathId)) throw Error(`Runtime prefab graph contains a parent cycle at PathID ${n.pathId}.`);
		let e = t.get(n.parentPathId);
		if (!e) break;
		n = e;
	}
	return n;
}
function Aa(e) {
	let t = e.transformPath?.split("/")[0];
	return t ? `${e.runtimePartIndex ?? -1}:${t}` : null;
}
function ja(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of ya(e)?.meshes ?? []) {
		if (typeof r.rendererTransformPathId != "number") continue;
		let e = t.get(r.rendererTransformPathId);
		if (!e) continue;
		let i = ka(e, t), a = Aa(e);
		if (!a || typeof i.pathId != "number") continue;
		let o = n.get(a);
		if (o !== void 0 && o !== i.pathId) throw Error(`Runtime native meshes reference multiple Unity prefab instances for '${a}' (${o}, ${i.pathId}).`);
		n.set(a, i.pathId);
	}
	return n;
}
function Ma(t, n) {
	let r = va(t);
	if (!r?.prefabGraphs?.length) return null;
	let i = new e.Group();
	i.name = "UnityPrefabSourceRoot", i.userData.pjskUnityPrefabSourceGraph = !0;
	let a = Pa(t);
	i.scale.setScalar(a.scale), i.userData.pjskSourceScaleCorrection = a;
	let o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Map();
	for (let e of r.prefabGraphs) for (let t of e.transforms ?? []) typeof t.pathId != "number" || !t.transformPath || (s.set(t.pathId, t), l.set(t.transformPath, (l.get(t.transformPath) ?? 0) + 1));
	let u = new Set([...l.entries()].filter(([, e]) => e > 1).map(([e]) => e)), d = ja(t, s);
	for (let t of r.prefabGraphs) for (let n of t.transforms ?? []) {
		if (typeof n.pathId != "number" || !n.transformPath) continue;
		let t = new e.Object3D();
		t.name = n.name ?? n.transformPath.split("/").pop() ?? `path_${n.pathId}`, t.userData.pjskTransformPath = n.transformPath, t.userData.pjskRuntimePartIndex = n.runtimePartIndex, t.userData.pjskPoseRoot = n.poseRoot ?? null, t.position.copy(er(z(n.localPosition, new e.Vector3()))), t.quaternion.copy(nr($n(n.localRotation))), t.scale.copy(z(n.localScale, new e.Vector3(1, 1, 1))), t.updateMatrix(), o.set(n.pathId, t);
		let r = ka(n, s), i = d.get(Aa(n) ?? "");
		(i === void 0 || i === r.pathId || !c.has(n.transformPath)) && c.set(n.transformPath, t);
	}
	for (let [e, t] of o.entries()) {
		let n = s.get(e)?.parentPathId;
		((typeof n == "number" ? o.get(n) : null) ?? i).add(t);
	}
	i.updateMatrixWorld(!0);
	let f = Na(i), p = r.bodyHeadAssembly;
	if (!ba(p)) throw Error("Runtime package must provide the official model_combine_setup body/head assembly.");
	let m = Q(c, [p.parentAttachPath]), h = Q(c, [p.childRootPath]), g = Q(c, [p.childOriginPath]);
	if (!m || !h || !g) throw Error("Official model_combine_setup body/head roots were not fully resolved.");
	let _ = Da(t, h.path), v = Ea(i, c, o, p, _), y = Oa(t, m.path.split("/")[0]), b = y ? c.get(y) ?? null : null, ee = Na(i), te = f - ee, x = [];
	if (n) {
		let e = Mi(n);
		for (let [t, n] of c.entries()) {
			let r = e.get(t);
			r && x.push({
				source: n,
				target: r
			});
		}
	}
	let ne = {
		active: !0,
		sourcePath: v.bodyNodeA.path,
		targetPath: v.faceNodeA.path,
		reason: null,
		setupVersion: String(r.version ?? ""),
		sourceScaleCorrection: a,
		mountedHeadRootCount: 1,
		mountedHeadOriginPaths: [v.faceNodeA.path],
		assemblyCounts: {
			inputTransforms: f,
			retainedTransforms: ee,
			removedTransforms: te,
			capturedCommonRemovedTransforms: 14,
			removedAtLeastCapturedCommonCount: te >= 14
		},
		targetCount: x.length,
		targetPaths: x.slice(0, 24).map((e) => String(e.source.userData.pjskTransformPath ?? e.source.name)),
		keyNodes: {
			runtimeMount: null,
			modelCombineBodyNeck: Ya(v.bodyNodeA.node, i),
			modelCombineFaceNeck: Ya(v.faceNodeA.node, i)
		}
	};
	return {
		root: i,
		nodeByPath: c,
		nodeByPathId: o,
		ambiguousPaths: u,
		meshCarrierBindings: x,
		bodyAttach: v.faceNodeA.node,
		bodyAttachPath: m.path,
		headRoot: v.faceNodeA.node,
		headRootPath: v.faceNodeA.path,
		headOrigin: v.faceNodeA.node,
		headOriginPath: v.faceNodeA.path,
		bodyRootBone: b,
		bodyRootBonePath: y,
		headRendererPaths: _,
		debug: ne
	};
}
function Na(e) {
	let t = 0;
	return e.traverse((n) => {
		n !== e && (t += 1);
	}), t;
}
function Pa(e) {
	let t = Z(e), n = Z(t.character ?? t.Character), r = Z(t.bodyManifest ?? t.BodyManifest);
	return {
		characterHeightMeters: _a(n.characterHeightMeters ?? n.CharacterHeightMeters ?? r.CharacterHeightMeters ?? r.characterHeightMeters),
		scale: 1,
		reason: "presentation-module-applies-position-scale"
	};
}
function Fa(t, n) {
	let r = ya(n), i = r?.meshes ?? [];
	if (!r || i.length === 0) return {
		meshCount: 0,
		boneCount: t.nodeByPath.size,
		skinnedMeshCount: 0,
		skinBindings: [],
		error: "Unity runtime nativeMeshes version 0414 is missing or empty.",
		warnings: r?.warnings ?? []
	};
	let a = 0, o = 0, s = [], c = [...r.warnings ?? []], l = [];
	t.root.updateMatrixWorld(!0);
	for (let n of i) {
		let r = n.rendererTransformPath, i = n.bonePaths ?? [], u = n.bonePathIds ?? [], d = [
			...typeof n.rendererTransformPathId == "number" ? [] : [r],
			...u.length === 0 ? i : [],
			...typeof n.rootBonePathId == "number" ? [] : [n.rootBonePath]
		].filter((e) => !!(e && t.ambiguousPaths.has(e)));
		if (d.length > 0) {
			let e = `Native mesh '${n.meshPath ?? n.meshName ?? "<unnamed>"}' has an ambiguous legacy PathID-less skin binding (${[...new Set(d)].join(", ")}); regenerate it with a current Haruki-3D-Exporter.`;
			c.push(e), l.push(e);
			continue;
		}
		if (u.length > 0 && u.length !== i.length) {
			let e = `Native mesh '${n.meshPath ?? n.meshName ?? "<unnamed>"}' has ${i.length} bone paths but ${u.length} bone PathIDs; regenerate it with a current Haruki-3D-Exporter.`;
			c.push(e), l.push(e);
			continue;
		}
		let f = typeof n.rendererTransformPathId == "number" ? t.nodeByPathId.get(n.rendererTransformPathId) : r ? t.nodeByPath.get(r) : null;
		if (!f) {
			let e = `Native mesh '${n.meshPath ?? n.meshName ?? "<unnamed>"}' skipped: renderer transform '${r ?? "<null>"}' was not found.`;
			c.push(e), typeof n.rendererTransformPathId == "number" && l.push(e);
			continue;
		}
		let p = za(n);
		if (!p) {
			c.push(`Native mesh '${n.meshPath ?? n.meshName ?? "<unnamed>"}' skipped: invalid geometry payload.`);
			continue;
		}
		let m = (n.submeshes ?? []).map((t) => {
			if (!t.materialKey || typeof t.slotIndex != "number") throw Error(`Native mesh '${n.meshPath ?? n.meshName ?? "<unnamed>"}' has a submesh without material identity; regenerate it with Haruki-3D-Exporter materialKey runtime support.`);
			let r = new e.MeshBasicMaterial({
				color: 16777215,
				vertexColors: p.hasAttribute("color")
			});
			return r.name = t.materialName ?? n.meshName ?? n.meshPath ?? "native_material", r.userData.pjskMaterialKey = t.materialKey, r.userData.pjskMaterialSlotIndex = t.slotIndex, r;
		}), h = m.length > 0 ? m : [new e.MeshBasicMaterial({ color: 16777215 })], g = n.meshName ?? n.meshPath?.split("/").pop() ?? "UnityNativeMesh", _ = i.map((e, n) => u.length > 0 ? t.nodeByPathId.get(u[n]) : t.nodeByPath.get(e)).filter((e) => !!e), v, y = null, b = [];
		if (i.length > 0) {
			if (_.length !== i.length) {
				let e = `Native mesh '${n.meshPath ?? g}' skipped: ${i.length - _.length} skin bones were unresolved.`;
				c.push(e), l.push(e), p.dispose();
				continue;
			}
			let t = new e.SkinnedMesh(p, h);
			v = t, y = t, b = _, o += 1;
		} else v = new e.Mesh(p, h);
		if (v.name = g, v.userData.pjskNativeUnityMesh = !0, v.userData.pjskPartKind = n.partKind ?? null, v.userData.pjskRendererPathId = n.rendererPathId ?? null, v.frustumCulled = !1, f.add(v), y) {
			t.root.updateMatrixWorld(!0), y.updateMatrixWorld(!0);
			let i = Ra(n, b.length, c), a = y.matrixWorld.clone();
			if (i.length > 0) {
				let e = a.clone().invert();
				for (let t of i) t.multiply(e);
			}
			let o = new e.Skeleton(b, i.length > 0 ? i : void 0);
			i.length === 0 && o.calculateInverses(), y.bind(o, a);
			let l = Ia(b[0], o.boneInverses[0]), u = La(b, o.boneInverses);
			s.push({
				meshName: g,
				partKind: n.partKind ?? null,
				rendererTransformPath: r ?? null,
				rootBonePath: n.rootBonePath ?? null,
				rootBoneResolved: typeof n.rootBonePathId == "number" ? t.nodeByPathId.has(n.rootBonePathId) : n.rootBonePath ? t.nodeByPath.has(n.rootBonePath) : !1,
				effectiveRootBonePath: r && t.headRendererPaths.includes(r) ? t.bodyRootBonePath : n.rootBonePath ?? null,
				effectiveRootBoneResolved: r && t.headRendererPaths.includes(r) ? !!t.bodyRootBone : typeof n.rootBonePathId == "number" ? t.nodeByPathId.has(n.rootBonePathId) : n.rootBonePath ? t.nodeByPath.has(n.rootBonePath) : !1,
				boneCount: b.length,
				...l,
				...u
			});
		}
		a += 1;
	}
	return t.root.updateMatrixWorld(!0), {
		meshCount: a,
		boneCount: t.nodeByPath.size,
		skinnedMeshCount: o,
		skinBindings: s,
		error: l.length > 0 ? l.join(" ") : a > 0 ? null : "Unity runtime nativeMeshes did not produce any renderable mesh.",
		warnings: c
	};
}
function Ia(t, n) {
	let r = new e.Matrix4().multiplyMatrices(t.matrixWorld, n), i = new e.Vector3(), a = new e.Quaternion(), o = new e.Vector3();
	return r.decompose(i, a, o), {
		restTranslation: qa(i),
		restScale: qa(o)
	};
}
function La(t, n) {
	if (t.length < 2 || n.length !== t.length) return {
		restMatrixSpread: 0,
		restMatrixSpreadBonePath: null
	};
	let r = new e.Matrix4().multiplyMatrices(t[0].matrixWorld, n[0]), i = new e.Matrix4(), a = 0, o = null;
	for (let e = 1; e < t.length; e += 1) {
		i.multiplyMatrices(t[e].matrixWorld, n[e]);
		for (let n = 0; n < 16; n += 1) {
			let s = Math.abs(i.elements[n] - r.elements[n]);
			s > a && (a = s, o = String(t[e].userData.pjskTransformPath ?? t[e].name));
		}
	}
	let s = Number(a.toFixed(6));
	return {
		restMatrixSpread: s,
		restMatrixSpreadBonePath: s > 0 ? o : null
	};
}
function Ra(t, n, r) {
	let i = t.boneInverseBindMatrices ?? [];
	if (n === 0 || i.length === 0) return [];
	if (i.length !== n * 16) return r.push(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has ${i.length} inverse bind matrix floats for ${n} bones; expected ${n * 16}.`), [];
	let a = [];
	for (let t = 0; t < i.length; t += 16) a.push(new e.Matrix4().fromArray(i, t));
	return a;
}
function za(t) {
	let n = t.positions ?? [];
	if (n.length === 0 || n.length % 3 != 0) return null;
	let r = n.length / 3, i = new e.BufferGeometry();
	i.setAttribute("position", new e.Float32BufferAttribute(n, 3)), (t.normals?.length ?? 0) === r * 3 && i.setAttribute("normal", new e.Float32BufferAttribute(t.normals, 3)), (t.tangents?.length ?? 0) === r * 4 && i.setAttribute("tangent", new e.Float32BufferAttribute(t.tangents, 4)), (t.uv0?.length ?? 0) === r * 2 && i.setAttribute("uv", new e.Float32BufferAttribute(t.uv0, 2)), (t.uv1?.length ?? 0) === r * 2 && i.setAttribute("uv1", new e.Float32BufferAttribute(t.uv1, 2)), (t.uv2?.length ?? 0) === r * 2 && i.setAttribute("uv2", new e.Float32BufferAttribute(t.uv2, 2)), (t.colors?.length ?? 0) === r * 4 && i.setAttribute("color", new e.Float32BufferAttribute(t.colors, 4)), (t.skinIndices?.length ?? 0) === r * 4 && i.setAttribute("skinIndex", new e.Uint16BufferAttribute(t.skinIndices, 4)), (t.skinWeights?.length ?? 0) === r * 4 && i.setAttribute("skinWeight", new e.Float32BufferAttribute(t.skinWeights, 4));
	let a = [];
	for (let e of t.submeshes ?? []) {
		let t = a.length, n = e.indices ?? [];
		a.push(...n), i.addGroup(t, n.length, i.groups.length);
	}
	a.length > 0 && i.setIndex(a);
	let o = [], s = [];
	for (let n of t.morphTargets ?? []) {
		let t = n.indices ?? [], i = n.positionDeltas ?? [];
		if (t.length === 0 || i.length !== t.length * 3) continue;
		let a = new Float32Array(r * 3), c = n.normalDeltas?.length === t.length * 3 ? new Float32Array(r * 3) : null;
		for (let e = 0; e < t.length; e += 1) {
			let o = t[e];
			!Number.isInteger(o) || o < 0 || o >= r || (a[o * 3] = i[e * 3] ?? 0, a[o * 3 + 1] = i[e * 3 + 1] ?? 0, a[o * 3 + 2] = i[e * 3 + 2] ?? 0, c && n.normalDeltas && (c[o * 3] = n.normalDeltas[e * 3] ?? 0, c[o * 3 + 1] = n.normalDeltas[e * 3 + 1] ?? 0, c[o * 3 + 2] = n.normalDeltas[e * 3 + 2] ?? 0));
		}
		let l = new e.BufferAttribute(a, 3);
		if (l.name = n.name ?? `morph_${o.length}`, o.push(l), c) {
			let t = new e.BufferAttribute(c, 3);
			t.name = l.name, s.push(t);
		}
	}
	return o.length > 0 && (i.morphAttributes.position = o, i.morphTargetsRelative = !0), s.length === o.length && s.length > 0 && (i.morphAttributes.normal = s), i.computeBoundingSphere(), i;
}
function Ba(e, t, n, r) {
	e.root.updateMatrixWorld(!0);
	let i = r ? r.update() : Hi(e, va(t)?.constraintSetup, n);
	for (let t of e.meshCarrierBindings) t.target.position.copy(t.source.position), t.target.quaternion.copy(t.source.quaternion), t.target.scale.copy(t.source.scale), t.target.updateMatrix();
	return e.root.updateMatrixWorld(!0), i;
}
function Va(e, t, n) {
	let r = va(t)?.constraintSetup;
	return r ? new Vi(e, r, n) : null;
}
function Ha(e, t, n) {
	let r = {
		...e?.debug ?? n,
		setupVersion: Ua(t)
	};
	if (!e) return r;
	let i = e.root;
	i.updateMatrixWorld(!0);
	let a = va(t)?.bodyHeadAssembly, o = Mi(i), s = (t) => {
		let n = Q(e.nodeByPath, t) ?? Wa(o, t);
		return n ? Ya(n.node, i) : null;
	}, c = s([
		a?.parentCombineNodeAPath ?? "",
		e.debug.sourcePath ?? "",
		"body/Position/PositionOffset/Hip/Waist/Spine/Chest/Neck",
		"body/Position/Hip/Waist/Spine/Chest/Neck"
	]), l = s([
		a?.parentCombineNodeBPath ?? "",
		e.debug.sourcePath ? `${e.debug.sourcePath}/Head` : "",
		"body/Position/PositionOffset/Hip/Waist/Spine/Chest/Neck/Head",
		"body/Position/Hip/Waist/Spine/Chest/Neck/Head"
	]), u = s(["face/Position"]), d = s([
		a?.childCombineNodeAPath ?? "",
		e.debug.targetPath ?? "",
		"face/Position/Hip/Waist/Spine/Chest/Neck"
	]), f = s([
		a?.childCombineNodeBPath ?? "",
		e.debug.targetPath ? `${e.debug.targetPath}/Head` : "",
		"face/Position/Hip/Waist/Spine/Chest/Neck/Head"
	]), p = s(["mdl_chr_IDL_A_00/Position", "mdl_chr_IDL_A_00/Position_4"]);
	return {
		...r,
		positionRoots: Xa(i),
		assemblyDistances: {
			bodyNeckToFaceNeck: null,
			bodyHeadToFaceHead: null
		},
		keyNodes: {
			...r.keyNodes ?? {},
			bodyNeck: c,
			bodyHead: l,
			facePosition: u,
			faceNeck: d,
			faceHead: f,
			meshContainerPosition: p
		}
	};
}
function Ua(e) {
	let t = Z(e), n = Z(t.pjskSpringBone ?? t.PjskSpringBone), r = Z(t.runtimeUnitySetup ?? t.RuntimeUnitySetup ?? n.runtimeUnitySetup ?? n.RuntimeUnitySetup);
	return String(r.version ?? r.Version ?? "");
}
function Wa(e, t) {
	for (let n of t) {
		let t = e.get(n);
		if (t) return {
			node: t,
			path: n
		};
	}
	return null;
}
function Ga(e) {
	return e.replace(/_\d+$/, "");
}
function Ka(e, t, n = !1) {
	let r = [], i = e;
	for (; i && i !== t;) i.name && r.push(n ? Ga(i.name) : i.name), i = i.parent;
	return r.reverse().join("/");
}
function qa(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5))
	};
}
function Ja(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5)),
		w: Number(e.w.toFixed(5))
	};
}
function Ya(t, n) {
	t.updateMatrixWorld(!0);
	let r = new e.Vector3(), i = new e.Quaternion(), a = new e.Vector3(0, 0, 1);
	return t.getWorldPosition(r), t.getWorldQuaternion(i), a.applyQuaternion(i).normalize(), {
		path: Ka(t, n),
		canonicalPath: Ka(t, n, !0),
		parentPath: t.parent && t.parent !== n ? Ka(t.parent, n) : null,
		destroyed: t.userData.pjskModelCombineDestroyed === !0,
		localPosition: qa(t.position),
		localQuaternion: Ja(t.quaternion),
		worldPosition: qa(r),
		worldQuaternion: Ja(i),
		worldForward: qa(a)
	};
}
function Xa(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	return e.updateMatrixWorld(!0), e.traverse((r) => {
		if (r === e || !r.name || n.has(r)) return;
		let i = Ka(r, e, !0), a = i === "face/Position", o = i === "body/Position", s = i.endsWith("/Position") && i.split("/").some((e) => e.startsWith("mdl_chr_"));
		!a && !o && !s || (n.add(r), t.push(Ya(r, e)));
	}), t;
}
//#endregion
//#region src/engine/runtimeMotion.ts
function $(e) {
	return e && typeof e == "object" ? e : {};
}
function Za(e, t) {
	return /(?:^|[_-])loop$/i.test(e ?? "") || /(?:^|[_-])loop(?:\.json)?$/i.test(t?.split("/").pop() ?? "");
}
function Qa(e, t, n, r, i = 1e-4) {
	let a = n * t, o = r * t;
	for (let n = 0; n < t; n += 1) if (Math.abs(e[a + n] - e[o + n]) > i) return !1;
	return !0;
}
function $a(e, t) {
	let n = e[t], r = e[t + 1], i = e[t + 2], a = e[t + 3], o = Math.hypot(n, r, i, a);
	if (o < 1e-8) {
		e[t] = 0, e[t + 1] = 0, e[t + 2] = 0, e[t + 3] = 1;
		return;
	}
	e[t] = n / o, e[t + 1] = r / o, e[t + 2] = i / o, e[t + 3] = a / o;
}
function eo(e, t) {
	if (t === 4) for (let n = t; n < e.length; n += t) {
		let r = n - t;
		e[r] * e[n] + e[r + 1] * e[n + 1] + e[r + 2] * e[n + 2] + e[r + 3] * e[n + 3] < 0 && (e[n] *= -1, e[n + 1] *= -1, e[n + 2] *= -1, e[n + 3] *= -1);
	}
}
function to(t, n, r, i, a, o, s, c, l) {
	let u = Math.max(s - o, 1e-6), d = e.MathUtils.clamp((l - o) / u, 0, 1), f = d * d, p = f * d, m = (r - t) / Math.max(s - a, 1e-6), h = (i - n) / Math.max(c - o, 1e-6), g = 2 * p - 3 * f + 1, _ = p - 2 * f + d, v = -2 * p + 3 * f, y = p - f;
	return g * n + _ * u * m + v * r + y * u * h;
}
function no(t, n, r) {
	let i = t instanceof e.QuaternionKeyframeTrack, a = t instanceof e.VectorKeyframeTrack && t.name.endsWith(".position");
	if (!i && !a) return t.clone();
	let o = t.getValueSize(), s = Array.from(t.times), c = Array.from(t.values), l = s.length;
	if (l < 3 || n <= 0 || (Math.abs(s[l - 1] - n) < .001 && Qa(c, o, 0, l - 1) && --l, l < 3)) return t.clone();
	let u = s.slice(0, l), d = c.slice(0, l * o);
	i && eo(d, o);
	let f = Math.max(2, Math.round(n * r)), p = new Float32Array(f + 1), m = new Float32Array((f + 1) * o), h = 0;
	for (let e = 0; e <= f; e += 1) {
		let t = e * o, r = e === f ? n : n * e / f;
		if (p[e] = r, e === f) {
			for (let e = 0; e < o; e += 1) m[t + e] = m[e];
			continue;
		}
		for (; h < l - 1 && r > u[h + 1];) h += 1;
		let a = h, s = h + 1 < l ? h + 1 : 0, c = (a - 1 + l) % l, g = (s + 1) % l, _ = u[c], v = u[a], y = u[s], b = u[g];
		c >= a && (_ -= n), s <= a && (y += n), g <= a && (b += n);
		for (let e = 0; e < o; e += 1) m[t + e] = to(d[c * o + e], d[a * o + e], d[s * o + e], d[g * o + e], _, v, y, b, r);
		i && $a(m, t);
	}
	return i ? new e.QuaternionKeyframeTrack(t.name, p, m) : new e.VectorKeyframeTrack(t.name, p, m);
}
function ro(e) {
	let t = e.tracks.filter((e) => e.times.length > 2);
	return t.length ? t.some((t) => t.times.length < Math.max(12, e.duration * 24)) : !1;
}
function io(t, n = 60) {
	return ro(t) ? new e.AnimationClip(t.name, t.duration, t.tracks.map((e) => no(e, t.duration, n))) : t;
}
function ao(e) {
	return /^(Head|Neck)\.(position|quaternion|scale)$/.test(e.name);
}
function oo(e, t = /* @__PURE__ */ new Set()) {
	if (!e) return null;
	let n = e.tracks.filter((e) => /hair/i.test(e.name)), r = e.tracks.filter((e) => /^Head\./.test(e.name)), i = e.tracks.filter((e) => /^Neck\./.test(e.name)), a = e.tracks.filter((e) => /^(Position|Hip|Waist|Spine|Chest|Neck|Head)\./.test(e.name)), o = e.tracks.filter((e) => /\.(position|quaternion|scale)$/.test(e.name)), s = e.tracks.filter((e) => so(e, t));
	return {
		trackCount: e.tracks.length,
		transformTrackCount: o.length,
		hairTrackCount: n.length,
		headTrackCount: r.length,
		neckTrackCount: i.length,
		upperBodyTrackCount: a.length,
		utjControlledTrackCount: s.length,
		sampleHairTracks: n.slice(0, 12).map((e) => e.name),
		sampleHeadTracks: [...r, ...i].slice(0, 12).map((e) => e.name),
		sampleUtjControlledTracks: s.slice(0, 12).map((e) => e.name)
	};
}
function so(e, t) {
	if (t.size === 0) return !1;
	let n = e.name.split(".")[0];
	return t.has(n);
}
function co(t) {
	return t.tracks.some(ao) ? new e.AnimationClip(`${t.name || "motion"}_no_head_tracks`, t.duration, t.tracks.filter((e) => !ao(e))) : t;
}
function lo(e, t) {
	return t ? e : co(e);
}
function uo(e) {
	return /(?:^|\/)unity-motion\.msgpack\.br(?:$|[?#])/i.test(e);
}
function fo(e, t) {
	return e ? t ?? (uo(e) ? "unity-json" : null) : null;
}
function po(e, t) {
	return `${t ?? "unknown"}:${e}`;
}
function mo(e) {
	let t = $(e), n = String(t.version ?? t.Version ?? ""), r = t.clips ?? t.Clips;
	if (n !== "0414" || !Array.isArray(r)) throw Error("Unity motion runtime must be version 0414 and contain clips.");
	let i = r.map(ho);
	if (!i.length) throw Error("Unity motion runtime contains no clips.");
	return {
		version: n,
		clips: i
	};
}
function ho(e) {
	let t = $(e), n = String(t.name ?? t.Name ?? "motion"), r = t.tracks ?? t.Tracks;
	if (!Array.isArray(r)) throw Error(`Unity motion clip ${n} contains no tracks.`);
	let i = r.map(go);
	if (!i.length) throw Error(`Unity motion clip ${n} contains no valid tracks.`);
	return {
		name: n,
		tracks: i
	};
}
function go(e) {
	let t = $(e), n = String(t.nodeKey ?? t.NodeKey ?? ""), r = String(t.property ?? t.Property ?? ""), i = Number(t.componentCount ?? t.ComponentCount), a = _o(t.times ?? t.Times), o = _o(t.values ?? t.Values);
	if (!n || !r || !Number.isInteger(i)) throw Error("Unity motion track is missing nodeKey, property, or componentCount.");
	if (!a.length || o.length !== a.length * i) throw Error(`Unity motion track ${n}.${r} has inconsistent sample arrays.`);
	return {
		nodeKey: n,
		property: r,
		componentCount: i,
		times: a,
		values: o
	};
}
function _o(e) {
	if (e instanceof Float32Array || e instanceof Uint16Array || e instanceof Uint32Array) return e;
	if (!Array.isArray(e)) return [];
	if (e.every((e) => typeof e == "number" && Number.isFinite(e))) return e;
	let t = e.map(Number);
	if (!t.every(Number.isFinite)) throw Error("Unity motion numeric array contains non-finite values.");
	return t;
}
function vo(t) {
	let n = t.property === "translation" ? "position" : t.property === "rotation" ? "quaternion" : t.property, r = `${t.nodeKey}.${n}`;
	if (n === "position" || n === "scale") {
		if (t.componentCount !== 3) throw Error(`Unity motion track ${r} must have 3 components.`);
		return new e.VectorKeyframeTrack(r, t.times, t.values);
	}
	if (n === "quaternion") {
		if (t.componentCount !== 4) throw Error(`Unity motion track ${r} must have 4 components.`);
		return new e.QuaternionKeyframeTrack(r, t.times, t.values);
	}
	throw Error(`Unsupported Unity motion property: ${t.property}`);
}
function yo(t) {
	return mo(t).clips.map((t) => {
		let n = t.tracks.map(vo), r = n.flatMap((e) => Array.from(e.times)).reduce((e, t) => Math.max(e, t), 0);
		return new e.AnimationClip(t.name, r, n);
	});
}
function bo(e) {
	let t = $(e), n = $(t.motionPackage ?? t.MotionPackage), r = $(n.bodyMotionBindings ?? n.BodyMotionBindings), i = r.bindings ?? r.Bindings;
	return Array.isArray(i) ? {
		version: String(r.version ?? r.Version ?? ""),
		bindingMode: String(r.bindingMode ?? r.BindingMode ?? ""),
		warnings: Eo(r.warnings ?? r.Warnings),
		bindings: i.map(xo).filter((e) => !!e)
	} : null;
}
function xo(e) {
	let t = $(e), n = Number(t.pathCrc ?? t.PathCrc), r = String(t.nodeKey ?? t.NodeKey ?? ""), i = String(t.leafName ?? t.LeafName ?? ""), a = t.targets ?? t.Targets;
	if (!Number.isFinite(n) || !r || !Array.isArray(a)) return null;
	let o = a.map(So).filter((e) => !!e);
	return {
		pathCrc: n,
		nodeKey: r,
		leafName: i,
		importedPath: Do(t.importedPath ?? t.ImportedPath),
		sourceRest: Co(t.sourceRest ?? t.SourceRest),
		targetCount: Number(t.targetCount ?? t.TargetCount ?? o.length),
		targets: o
	};
}
function So(e) {
	let t = $(e), n = String(t.poseRoot ?? t.PoseRoot ?? ""), r = String(t.transformPath ?? t.TransformPath ?? ""), i = Number(t.pathId ?? t.PathId);
	return !n || !r || !Number.isFinite(i) ? null : {
		poseRoot: n,
		transformPath: r,
		pathId: i,
		rest: Co(t.rest ?? t.Rest)
	};
}
function Co(e) {
	let t = $(e), n = wo(t.position ?? t.Position), r = To(t.rotation ?? t.Rotation), i = wo(t.scale ?? t.Scale);
	return !n || !r || !i ? null : {
		position: n,
		rotation: r,
		scale: i
	};
}
function wo(t) {
	let n = $(t), r = Number(n.x ?? n.X), i = Number(n.y ?? n.Y), a = Number(n.z ?? n.Z);
	return Number.isFinite(r) && Number.isFinite(i) && Number.isFinite(a) ? new e.Vector3(r, i, a) : null;
}
function To(t) {
	let n = $(t), r = Number(n.x ?? n.X), i = Number(n.y ?? n.Y), a = Number(n.z ?? n.Z), o = Number(n.w ?? n.W);
	return !Number.isFinite(r) || !Number.isFinite(i) || !Number.isFinite(a) || !Number.isFinite(o) ? null : new e.Quaternion(r, i, a, o).normalize();
}
function Eo(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "string") : [];
}
function Do(e) {
	return typeof e == "string" && e.length > 0 ? e : null;
}
function Oo(e, t) {
	let n = e.clone();
	return n.name = t, n;
}
function ko(t, n, r, i, a) {
	if (a.poseRoot !== "face") return Oo(t, n);
	if (!i.sourceRest || !a.rest) return null;
	if (r === "position") {
		let r = [];
		for (let n = 0; n < t.values.length; n += 3) {
			let o = new e.Vector3(t.values[n], t.values[n + 1], t.values[n + 2]), s = a.rest.position.clone().add(o.sub(i.sourceRest.position));
			r.push(s.x, s.y, s.z);
		}
		return new e.VectorKeyframeTrack(n, t.times, r);
	}
	if (r === "quaternion") {
		let r = [], o = i.sourceRest.rotation.clone().invert();
		for (let n = 0; n < t.values.length; n += 4) {
			let i = new e.Quaternion(t.values[n], t.values[n + 1], t.values[n + 2], t.values[n + 3]).normalize(), s = a.rest.rotation.clone().multiply(o).multiply(i).normalize();
			r.push(s.x, s.y, s.z, s.w);
		}
		return new e.QuaternionKeyframeTrack(n, t.times, r);
	}
	if (r === "scale") {
		let r = [], o = i.sourceRest.scale, s = a.rest.scale;
		if (o.x === 0 || o.y === 0 || o.z === 0) return null;
		for (let e = 0; e < t.values.length; e += 3) r.push(s.x * (t.values[e] / o.x), s.y * (t.values[e + 1] / o.y), s.z * (t.values[e + 2] / o.z));
		return new e.VectorKeyframeTrack(n, t.times, r);
	}
	return Oo(t, n);
}
function Ao(e) {
	return e.poseRoot === "face" && /^face\/Position(?:\/Hip(?:\/Waist(?:\/Spine(?:\/Chest(?:\/Neck(?:\/Head)?)?)?)?)?)?$/.test(e.transformPath);
}
function jo(e) {
	let t = $(e), n = $(t.pjskSpringBone ?? t.PjskSpringBone), r = $(t.runtimeUnitySetup ?? t.RuntimeUnitySetup ?? n.runtimeUnitySetup ?? n.RuntimeUnitySetup), i = r.version, a = i === "0414" || i === 414 ? $(r.bodyHeadAssembly) : {};
	return !!(a.parentingMode === "model_combine_setup" && a.parentAttachPath && a.childRootPath && a.childOriginPath);
}
function Mo(t, n, r) {
	let i = bo(r), a = {
		mode: "unity-prefab",
		bindingCount: i?.bindings.length ?? 0,
		sourceTrackCount: t.tracks.length,
		emittedTrackCount: 0,
		resolvedTargetCount: 0,
		resolvedBodyTargetCount: 0,
		resolvedFaceTargetCount: 0,
		unresolvedTrackCount: 0,
		duplicateTargetTrackCount: 0,
		sampleUnresolvedTracks: [],
		sampleResolvedHeadTargets: []
	};
	if (!i || i.version !== "0414" || i.bindings.length === 0) return {
		clip: null,
		debug: a,
		error: "Unity Prefab animation requires motionPackage.bodyMotionBindings version 0414."
	};
	let o = new Map(i.bindings.map((e) => [e.nodeKey, e])), s = Mi(n), c = jo(r), l = [], u = /* @__PURE__ */ new Set(), d = /* @__PURE__ */ new Set(), f = /* @__PURE__ */ new Set(), p = /* @__PURE__ */ new Set();
	for (let e of t.tracks) {
		let t = e.name.lastIndexOf("."), n = t > 0 ? e.name.slice(0, t) : "", r = t > 0 ? e.name.slice(t + 1) : "", i = o.get(n);
		if (!i || !r) {
			a.unresolvedTrackCount += 1, a.sampleUnresolvedTracks.length < 16 && a.sampleUnresolvedTracks.push(e.name);
			continue;
		}
		let m = 0;
		for (let t of i.targets) {
			if (c && Ao(t)) continue;
			let n = s.get(t.transformPath);
			if (!n) continue;
			let o = `${n.uuid}.${r}`;
			if (u.has(o)) {
				a.duplicateTargetTrackCount += 1;
				continue;
			}
			let h = ko(e, o, r, i, t);
			h && (u.add(o), l.push(h), t.poseRoot === "body" ? d.add(t.transformPath) : t.poseRoot === "face" && f.add(t.transformPath), p.size < 16 && /(?:^|\/)(Position|Hip|Waist|Spine|Chest|Neck|Head)$/.test(t.transformPath) && p.add(t.transformPath), m += 1);
		}
		m === 0 ? (a.unresolvedTrackCount += 1, a.sampleUnresolvedTracks.length < 16 && a.sampleUnresolvedTracks.push(e.name)) : a.resolvedTargetCount += m;
	}
	return a.emittedTrackCount = l.length, a.resolvedBodyTargetCount = d.size, a.resolvedFaceTargetCount = f.size, a.sampleResolvedHeadTargets = [...p], l.length === 0 || a.unresolvedTrackCount > 0 ? {
		clip: null,
		debug: a,
		error: `Unity Prefab animation retarget failed: ${a.unresolvedTrackCount} unresolved tracks.`
	} : {
		clip: new e.AnimationClip(`${t.name || "motion"}_unity_prefab`, t.duration, l),
		debug: a,
		error: null
	};
}
//#endregion
//#region src/engine/animationPlaybackRuntime.ts
function No(e) {
	return e instanceof Error ? e.message : String(e);
}
async function Po(e) {
	return yo(await P(e));
}
var Fo = class {
	loadClips;
	onLoopPromoted;
	clipCache = /* @__PURE__ */ new Map();
	smoothedLoopClipCache = /* @__PURE__ */ new WeakMap();
	context = null;
	motionUrl = null;
	motionKind = null;
	loopUrl = null;
	loopKind = null;
	activeClipName = null;
	duration = 0;
	action = null;
	loopAction = null;
	mixer = null;
	finishedHandler = null;
	error = null;
	retargetDebug = null;
	queuedLoopClipName = null;
	speed = 1;
	paused = !1;
	bodyHeadTracksEnabled = !0;
	revision = 0;
	constructor(e = {}) {
		this.loadClips = e.loadClips ?? Po, this.onLoopPromoted = e.onLoopPromoted ?? (() => void 0);
	}
	setSelection(e) {
		this.motionUrl = e?.motionUrl ?? null, this.motionKind = fo(this.motionUrl, e?.motionKind), this.loopUrl = e?.loopUrl ?? null, this.loopKind = fo(this.loopUrl, e?.loopKind);
	}
	hasSelection() {
		return this.motionUrl !== null;
	}
	matchesSelection(e, t) {
		return this.motionUrl === e && this.loopUrl === t;
	}
	capturePosition() {
		return {
			activeClipName: this.activeClipName,
			currentTime: this.action?.time ?? 0
		};
	}
	setPaused(e) {
		this.paused = e, this.applySettings();
	}
	setSpeed(e) {
		this.speed = e, this.applySettings();
	}
	getSpeed() {
		return this.speed;
	}
	isPaused() {
		return this.paused;
	}
	setBodyHeadTracksEnabled(e) {
		return this.bodyHeadTracksEnabled === e ? !1 : (this.bodyHeadTracksEnabled = e, !0);
	}
	step(e) {
		this.mixer?.update(Math.max(0, e));
	}
	seek(t) {
		let n = Math.max(this.duration, 0), r = n > 0 ? e.MathUtils.clamp(t, 0, n) : Math.max(t, 0);
		return this.paused = !0, this.applySettings(), this.action && (this.action.paused = !1, this.action.time = r), this.mixer?.update(0), this.applySettings(), r;
	}
	seekPhase(t) {
		let n = e.MathUtils.clamp(Number.isFinite(t) ? t : 0, 0, 1);
		return this.seek(Math.max(this.duration, 0) * n);
	}
	seekLoopPhase(e) {
		return this.promoteQueuedLoop(), this.seekPhase(e);
	}
	restorePosition(t) {
		if (!this.action) return;
		let n = !!(this.loopUrl && t.activeClipName && (t.activeClipName === this.queuedLoopClipName || Za(t.activeClipName, this.loopUrl)));
		n && this.promoteQueuedLoop();
		let r = Math.max(this.duration, 0);
		this.action.time = r > 0 ? n ? e.MathUtils.euclideanModulo(t.currentTime, r) : e.MathUtils.clamp(t.currentTime, 0, r) : Math.max(t.currentTime, 0), this.mixer?.update(0);
	}
	async refresh(e) {
		let t = ++this.revision;
		if (this.context = e, this.stopPlayback(), this.error = null, !this.motionUrl || !e.root) return { poseApplied: !0 };
		let n = await this.loadCachedClips(this.motionUrl, this.motionKind, !1, t);
		if (t !== this.revision || !n) return { poseApplied: !1 };
		if (!n.length) return this.error = `No clips found in ${this.motionUrl}`, { poseApplied: !1 };
		let r = n.find((e) => !Za(e.name, this.motionUrl)) ?? n[0], i = this.preparePlayableClip(r, e, !0);
		if (!i) return { poseApplied: !1 };
		let a = null;
		if (this.loopUrl === this.motionUrl) {
			let t = n.find((e) => Za(e.name, this.loopUrl)) ?? n.find((e) => e !== r) ?? null;
			a = t ? this.preparePlayableClip(t, e, !1) : null;
		} else if (this.loopUrl) {
			let n = await this.loadCachedClips(this.loopUrl, this.loopKind, !0, t);
			if (t !== this.revision) return { poseApplied: !1 };
			let r = n?.[0] ?? null;
			a = r ? this.preparePlayableClip(r, e, !1) : null;
		}
		return t === this.revision ? (this.installPlayback(e.root, i, a), { poseApplied: !0 }) : { poseApplied: !1 };
	}
	release(e = {}) {
		this.revision += 1, this.stopPlayback(), this.context = null, e.preserveSelection || this.setSelection(null), e.clearCache && this.clipCache.clear();
	}
	getSnapshot(e = {}) {
		let t = e.utjControlledNodeNames ?? /* @__PURE__ */ new Set(), n = this.context?.prefabHeadFollow, r = this.retargetDebug ? {
			...this.retargetDebug,
			prefabHeadFollow: n
		} : this.context?.retargetWithUnityPrefab ? {
			mode: "unity-prefab",
			bindingCount: 0,
			sourceTrackCount: 0,
			emittedTrackCount: 0,
			resolvedTargetCount: 0,
			resolvedBodyTargetCount: 0,
			resolvedFaceTargetCount: 0,
			unresolvedTrackCount: 0,
			duplicateTargetTrackCount: 0,
			sampleUnresolvedTracks: [],
			sampleResolvedHeadTargets: [],
			prefabHeadFollow: n
		} : null;
		return {
			selectedUrl: this.motionUrl,
			selectedLoopUrl: this.loopUrl,
			activeClipName: this.activeClipName,
			queuedLoopClipName: this.queuedLoopClipName,
			currentTime: this.action?.time ?? 0,
			duration: this.duration,
			paused: this.paused,
			speed: this.speed,
			faceMotionEnabled: e.faceMotionEnabled ?? !1,
			bodyHeadTracksEnabled: this.bodyHeadTracksEnabled,
			bodyTrackDebug: oo(this.action?.getClip() ?? null, t),
			bodyLoopTrackDebug: oo(this.loopAction?.getClip() ?? null, t),
			bodyRetargetDebug: r,
			error: this.error
		};
	}
	async loadCachedClips(e, t, n, r) {
		let i = po(e, t), a = this.clipCache.get(i);
		if (a) return a;
		if (t !== "unity-json") return n || (this.error = `Unity motion .msgpack.br is required for ${e}.`), null;
		try {
			let n = await this.loadClips(e, t);
			return this.clipCache.set(i, n), n;
		} catch (e) {
			return !n && r === this.revision && (this.error = No(e)), null;
		}
	}
	preparePlayableClip(e, t, n) {
		let r = lo(e, this.bodyHeadTracksEnabled);
		if (!t.retargetWithUnityPrefab) return n && (this.retargetDebug = {
			mode: "none",
			bindingCount: 0,
			sourceTrackCount: r.tracks.length,
			emittedTrackCount: r.tracks.length,
			resolvedTargetCount: r.tracks.length,
			resolvedBodyTargetCount: 0,
			resolvedFaceTargetCount: 0,
			unresolvedTrackCount: 0,
			duplicateTargetTrackCount: 0,
			sampleUnresolvedTracks: [],
			sampleResolvedHeadTargets: [],
			prefabHeadFollow: t.prefabHeadFollow
		}), r;
		if (!t.root) return this.error = "Unity Prefab animation requires a loaded prefab root.", null;
		let i = Mo(r, t.root, t.runtimeExtension);
		return n && (this.retargetDebug = {
			...i.debug,
			prefabHeadFollow: t.prefabHeadFollow
		}), i.error ? (this.error = i.error, null) : i.clip;
	}
	installPlayback(t, n, r) {
		this.mixer = new e.AnimationMixer(t);
		let i = n.name || this.motionUrl;
		if (this.activeClipName = i, this.duration = n.duration, this.action = this.mixer.clipAction(n, t), this.configureAction(this.action), this.action.reset(), r) {
			let n = this.getSmoothedLoopClip(r);
			this.loopAction = this.mixer.clipAction(n, t), this.configureAction(this.loopAction), this.loopAction.reset(), this.loopAction.enabled = !1, this.loopAction.loop = e.LoopRepeat, this.loopAction.clampWhenFinished = !1, this.action.loop = e.LoopOnce, this.action.clampWhenFinished = !0, this.queuedLoopClipName = n.name || this.loopUrl || `${i}_loop`, this.finishedHandler = (e) => {
				e.action === this.action && this.promoteQueuedLoop();
			}, this.mixer.addEventListener("finished", this.finishedHandler);
		} else this.action.loop = e.LoopRepeat, this.action.clampWhenFinished = !1, this.queuedLoopClipName = null;
		this.action.play(), this.applySettings(), this.mixer.update(0);
	}
	promoteQueuedLoop() {
		!this.loopAction || !this.mixer || !this.action || (this.removeFinishedHandler(), this.action.stop(), this.loopAction.enabled = !0, this.loopAction.reset(), this.loopAction.play(), this.action = this.loopAction, this.loopAction = null, this.activeClipName = this.queuedLoopClipName ?? this.action.getClip().name, this.duration = this.action.getClip().duration, this.queuedLoopClipName = null, this.onLoopPromoted(), this.applySettings());
	}
	applySettings() {
		for (let e of [this.action, this.loopAction]) e && (e.paused = this.paused, e.enabled = !0, e.setEffectiveTimeScale(this.paused ? 0 : this.speed));
	}
	configureAction(e) {
		e.zeroSlopeAtStart = !1, e.zeroSlopeAtEnd = !1;
	}
	getSmoothedLoopClip(e) {
		let t = this.smoothedLoopClipCache.get(e);
		if (t) return t;
		let n = io(e, 60);
		return n !== e && this.smoothedLoopClipCache.set(e, n), n;
	}
	removeFinishedHandler() {
		this.mixer && this.finishedHandler && (this.mixer.removeEventListener("finished", this.finishedHandler), this.finishedHandler = null);
	}
	stopPlayback() {
		this.removeFinishedHandler(), this.action?.stop(), this.loopAction?.stop(), this.mixer?.stopAllAction(), this.action = null, this.loopAction = null, this.mixer = null, this.activeClipName = null, this.duration = 0, this.retargetDebug = null, this.queuedLoopClipName = null;
	}
};
//#endregion
export { N as A, An as C, Kn as D, qn as E, r as F, It as M, nt as N, Zt as O, f as P, xn as S, Rn as T, Cr as _, oo as a, nr as b, ga as c, Fa as d, Ha as f, lr as g, ji as h, fo as i, Ht as j, Jt as k, Ma as l, Mi as m, io as n, lo as o, Ba as p, yo as r, Mo as s, Fo as t, Va as u, rr as v, Bn as w, z as x, er as y };
