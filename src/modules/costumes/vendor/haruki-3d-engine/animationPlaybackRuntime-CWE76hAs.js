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
		setViewZoom(t) {
			m(), e.setViewZoom(t), o || e.renderFrame();
		},
		setViewHeightOffset(t) {
			m(), e.setViewHeightOffset(t), o || e.renderFrame();
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
	return `${e}:${ge(t)}`;
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
			headPackagePath: ue(e, t.characterId, t.unit ?? null, r),
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
	return e.registry.filter((e) => e.characterId === t).filter((e) => r.unit === void 0 || S(e.unit, r.unit)).filter((e) => l(e) === n).filter(x).filter((t) => !r.loadedOnly || de(t) || e.packages.has(t.packagePath)).sort((e, t) => e.costume3dId - t.costume3dId);
}
function h(e) {
	let { partSet: t, selection: n, activeRoleId: r, resolveUrl: i } = e, a = f(n.characterId, n.unit);
	if (r !== null && a !== r) throw Error(`Custom switching is limited to role ${r}. Reload/select another role before switching to ${a}.`);
	let o = te(t, n.characterId, n.unit, "body", n.bodyCostume3dId), s = te(t, n.characterId, n.unit, "hair", n.hairCostume3dId), l = ne(t, n), u = {
		...n,
		headPackagePath: l.packagePath
	}, d = re(t, u, l), p = d && c(d.part) === "head" ? d : s, m = c(l) === "head" ? _(t, n) : null, h = m ? t.packages.get(m.packagePath) ?? null : null, v = d && c(d.part) === "head_optional" ? d : null, y = ie(t, n);
	ce(o, "body"), p && ce(p, "head"), fe(n.characterId, n.unit, [
		o,
		p,
		v,
		y
	].filter(Boolean)), pe(t.compatibility, u, c(l));
	let b = [
		o,
		p,
		v,
		y
	].filter(Boolean), ee = Te(l), ae = Ee(b, ee), oe = t.roleRuntimes.get(a) ?? null, se = t.roles.find((e) => f(e.characterId, e.unit) === a), le = g(t, se, o), ue = _e(o, i);
	ue.characterHeightMeters = le, ve(ue, oe);
	let x = ye(Ee([
		p,
		v,
		y
	].filter(Boolean), ee), u, i, h);
	x.characterHeightMeters = le;
	let de = Oe(ae, ue, x, oe);
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
			`motion:${oe?.motionPackage?.sourcePath ?? "none"}`
		].map(encodeURIComponent).join("-")}`,
		displayName: `Custom ${a}`,
		meshUrl: "",
		unityRuntimeJsonUrl: `haruki-composed://role-${a}/unity-runtime.msgpack.br`,
		unityRuntimeJsonPath: "viewer-composed-part-runtime",
		bodyAsset: ue,
		headAsset: x,
		skinColors: se?.skinColors,
		runtimeExtension: de
	};
}
function g(e, t, n) {
	if (!t) {
		let e = (D(n.manifest) ? n.manifest : null)?.characterHeightMeters;
		if (typeof e == "number" && Number.isFinite(e) && e > 0) return e;
		throw Error("Runtime role catalog entry is missing.");
	}
	if (typeof t.characterHeightMeters == "number" && Number.isFinite(t.characterHeightMeters) && t.characterHeightMeters > 0) return t.characterHeightMeters;
	let r = le(e, t.characterId, t.unit, "body", t.bodyCostume3dId), i = r ? e.packages.get(r.packagePath) : null, a = (D(i?.manifest) ? i.manifest : null)?.characterHeightMeters;
	if (typeof a == "number" && Number.isFinite(a) && a > 0) return a;
	throw Error(`Runtime role ${f(t.characterId, t.unit)} is missing master characterHeightMeters.`);
}
function _(e, t) {
	let n = e.roles.find((e) => e.characterId === t.characterId && S(e.unit, t.unit));
	return n ? e.registry.find((e) => e.characterId === n.characterId && S(e.unit, n.unit) && e.costume3dId === n.hairCostume3dId && l(e) === "hair" && x(e)) ?? null : null;
}
function v(e, t, n, r) {
	return e.registry.find((i) => l(i) === t && (n === void 0 || i.characterId === n) && (r === void 0 || S(i.unit, r)) && i.status !== "missing" && e.packages.has(i.packagePath));
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
	}).filter((e) => !de(e))], a = /* @__PURE__ */ new Map();
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
			return pe(e.compatibility, a, c(r)), {
				head: r,
				hair: i
			};
		} catch {}
	}
	return null;
}
function b(e, t, n, r, i) {
	let a = le(e, t, n, r, i);
	return !!(a && (de(a) || e.packages.has(a.packagePath)));
}
function ee(e, t, n, r) {
	return b(e, t, n, "head", r) || b(e, t, n, "head_optional", r);
}
function te(e, t, n, r, i) {
	let a = le(e, t, n, r, i);
	if (!a) throw Error(`Missing ${r} registry entry for role ${f(t, n)}, costume3dId ${i}.`);
	if (!e.packages.has(a.packagePath)) throw Error(`Missing loaded ${r} package for role ${f(t, n)}, ${oe(a)}.`);
	return se(e.packages.get(a.packagePath), a);
}
function ne(e, t) {
	let n = t.headPackagePath?.trim() || null, r = e.registry.filter((e) => e.characterId === t.characterId && S(e.unit, t.unit) && e.costume3dId === t.headCostume3dId && ["head", "head_optional"].includes(l(e) ?? "") && x(e) && (n === null || e.packagePath === n)).sort((e, t) => {
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
function re(e, t, n = ne(e, t)) {
	if (de(n)) return null;
	if (!e.packages.has(n.packagePath)) throw Error(`Missing loaded head package for role ${f(t.characterId, t.unit)}, ${oe(n)}.`);
	return se(e.packages.get(n.packagePath), n);
}
function ie(e, t) {
	let n = ae(e, t);
	if (!n || de(n)) return null;
	if (!e.packages.has(n.packagePath)) throw Error(`Missing loaded head_optional package for role ${f(t.characterId, t.unit)}, ${oe(n)}.`);
	return se(e.packages.get(n.packagePath), n);
}
function ae(e, t) {
	if (!t.headOptionalCostume3dId) return null;
	let n = e.registry.filter((e) => e.characterId === t.characterId && S(e.unit, t.unit) && e.costume3dId === t.headOptionalCostume3dId && l(e) === "head_optional" && x(e)).sort((e, t) => e.packagePath.localeCompare(t.packagePath));
	if (n.length === 0) throw Error(`Missing head_optional registry entry for role ${f(t.characterId, t.unit)}, costume3dId ${t.headOptionalCostume3dId}.`);
	let r = new Set(n.map((e) => e.packagePath));
	if (r.size > 1) throw Error(`Ambiguous head_optional registry entry for role ${f(t.characterId, t.unit)}, costume3dId ${t.headOptionalCostume3dId}; the legacy selector cannot identify one original source. Candidates: ${[...r].join(", ")}.`);
	return n[0];
}
function oe(e) {
	let t = [
		`costume3dId ${e.costume3dId}`,
		`partType ${c(e)}`,
		`packagePath ${e.packagePath}`
	];
	e.bundlePath && t.push(`bundlePath ${e.bundlePath}`), e.colorVariationBundlePath && t.push(`colorVariationBundlePath ${e.colorVariationBundlePath}`);
	let n = e.warnings?.[0];
	return n && t.push(`warning ${n}`), t.join(", ");
}
function se(e, t) {
	let n = l(t) ?? e.part.partType, r = D(e.manifest) ? Rt(e.manifest) : e.manifest;
	if (D(r) && (r.id = `${n}-${t.characterId}-${t.costume3dId}-${t.unit ?? "default"}`, r.displayName = t.name ?? C(r.displayName) ?? r.id, r.characterId = String(t.characterId).padStart(2, "0"), typeof r.characterHeightMeters != "number" || r.characterHeightMeters <= 0)) throw Error(`Part runtime ${t.packagePath} is missing characterHeightMeters.`);
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
function ce(e, t) {
	let n = D(e.manifest) ? e.manifest : {};
	if (!D(n.proxy ?? n.Proxy)) throw Error(`Part runtime package '${e.packagePath ?? e.part.costume3dId}' is missing manifest.proxy material metadata for ${t}; regenerate it with a current Haruki-3D-Exporter before capture.`);
}
function le(e, t, n, r, i) {
	return e.registry.find((e) => e.characterId === t && S(e.unit, n) && e.costume3dId === i && l(e) === r && x(e));
}
function ue(e, t, n, r) {
	let i = new Set(e.registry.filter((e) => e.characterId === t && S(e.unit, n) && e.costume3dId === r && ["head", "head_optional"].includes(l(e) ?? "") && x(e)).map((e) => e.packagePath));
	return i.size === 1 ? [...i][0] : null;
}
function x(e) {
	return e.status !== "missing";
}
function de(e) {
	return e.status === "empty" && l(e) === "head_optional";
}
function fe(e, t, n) {
	let r = n.find((n) => n.part.characterId !== e || !S(n.part.unit, t));
	if (r) throw Error(`Part ${r.part.partType}/${r.part.costume3dId} belongs to role ${f(r.part.characterId, r.part.unit)}, not ${f(e, t)}.`);
}
function pe(e, t, n) {
	if (!e || n === "head") return;
	let r = he(t.unit, t.headCostume3dId, t.hairCostume3dId);
	if (me(e).has(r)) throw Error(`Head ${t.headCostume3dId} and hair ${t.hairCostume3dId} are not available together.`);
}
function me(e) {
	if (!e) return /* @__PURE__ */ new Set();
	let t = o.get(e);
	if (t) return t;
	let n = new Set([...e.denied ?? [], ...(e.rules ?? []).filter((e) => e.state === "not_available")].map((e) => he(e.unit, e.headCostume3dId, e.hairCostume3dId)));
	return o.set(e, n), n;
}
function he(e, t, n) {
	return `${ge(e)}|${t}|${n}`;
}
function ge(e) {
	return e ?? "";
}
function S(e, t) {
	return ge(e) === ge(t);
}
function _e(e, t) {
	let n = Rt(e.manifest);
	if (n.id ||= `body-${e.part.costume3dId}`, n.displayName ||= e.part.name ?? n.id, n.characterId = String(e.part.characterId).padStart(2, "0"), typeof n.characterHeightMeters != "number" || n.characterHeightMeters <= 0) throw Error(`Body part runtime ${e.packagePath} is missing characterHeightMeters.`);
	n.materialPipeline ??= "embedded", n.source ||= {
		bundleRoot: "",
		manifestUrl: "",
		meshUrl: ""
	}, n.neckAnchor = we(n.neckAnchor, {
		x: 0,
		y: 1.75,
		z: .15
	}), n.skeleton ||= {}, n.skeleton.neckAttach ||= { fallbackPosition: {
		x: 0,
		y: 1.75,
		z: .15
	} }, n.skeleton.neckAttach.fallbackPosition = we(n.skeleton.neckAttach.fallbackPosition, {
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
	let r = be(e, t);
	return n.source = {
		...n.source,
		meshUrl: Lt(n.source?.meshUrl, r),
		skeletonUrl: E(n.source?.skeletonUrl, r),
		animationUrls: n.source?.animationUrls?.map((e) => Lt(e, r))
	}, n.bodyMaterials = Ft(n.bodyMaterials, [e], t), n;
}
function ve(e, t) {
	let n = t?.motionPackage?.unityMotionJson;
	n && (e.source = {
		...e.source,
		animationUrls: [n]
	});
}
function ye(e, t, n, r) {
	let i = e.find((e) => c(e.part) === "head") ?? e[0], a = Rt(i.manifest);
	if (a.id = `head-${t.headCostume3dId}-source-${encodeURIComponent(t.headPackagePath ?? "auto")}-hair-${t.hairCostume3dId}`, a.displayName = `Head ${t.headCostume3dId} / Hair ${t.hairCostume3dId}`, a.characterId = String(t.characterId).padStart(2, "0"), typeof a.characterHeightMeters != "number" || a.characterHeightMeters <= 0) throw Error(`Head part runtime ${i.packagePath} is missing characterHeightMeters.`);
	a.materialPipeline ??= "embedded", a.source ||= {
		bundleRoot: "",
		manifestUrl: "",
		meshUrl: ""
	}, a.rawImportOffset = we(a.rawImportOffset, {
		x: 0,
		y: 0,
		z: 0
	}), a.assembly ||= {}, a.assembly.attachOrigin ||= { fallbackPosition: {
		x: 0,
		y: 1.75,
		z: .15
	} }, a.assembly.attachOrigin.fallbackPosition = we(a.assembly.attachOrigin.fallbackPosition, {
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
	let o = be(i, n);
	return a.source = {
		...a.source,
		meshUrl: Lt(a.source?.meshUrl, o),
		skeletonUrl: E(a.source?.skeletonUrl, o),
		animationUrls: a.source?.animationUrls?.map((e) => Lt(e, o))
	}, a.faceMaterials = Pt(Ft(a.faceMaterials, e, n), r, n), a.morphChannelBindings = e.flatMap((e) => Array.isArray(e.morphChannelBindings) ? e.morphChannelBindings : []), a;
}
function be(e, t) {
	let n = C(e.packagePath) || C(e.mount?.packagePath) || "";
	return (e) => t(xe(n, e));
}
function xe(e, t) {
	if (!t || /^[a-z][a-z0-9+.-]*:/i.test(t) || t.startsWith("/")) return t;
	let n = Se(e);
	return !n || t.startsWith(`${n}/`) ? t : `${n}/${Ce(t)}`;
}
function Se(e) {
	let t = e.length;
	for (; t > 0 && e[t - 1] === "/";) --t;
	return e.slice(0, t);
}
function Ce(e) {
	let t = 0;
	for (; t < e.length && e[t] === "/";) t += 1;
	return e.slice(t);
}
function we(e, t) {
	return {
		x: typeof e?.x == "number" ? e.x : t.x,
		y: typeof e?.y == "number" ? e.y : t.y,
		z: typeof e?.z == "number" ? e.z : t.z
	};
}
function Te(e) {
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
function Ee(e, t) {
	return e.filter((e) => De(e, t));
}
function De(e, t) {
	return t.activePartTypes.has(c(e.part));
}
function C(e) {
	return typeof e == "string" ? e : "";
}
function Oe(e, t, n, r) {
	let i = Ae(e);
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
		characterControllers: ke(e),
		nativeMeshes: Tt(e, i),
		motionPackage: r?.motionPackage ?? null,
		morphChannelBindings: n.morphChannelBindings ?? [],
		pjskSpringBone: {
			raw: i.raw,
			runtimeUnitySetup: i
		},
		warnings: [...i.warnings ?? [], ...r?.warnings ?? []]
	};
}
function ke(e) {
	return e.find((e) => {
		let t = c(e.part);
		return t === "head" || t === "hair";
	})?.characterControllers ?? {};
}
function Ae(e) {
	let t = e.map((e, t) => Ge(e, t)), n = t[0]?.setup ?? {}, r = t.map((e) => e.prefabGraph).filter((e) => e !== null), i = e.flatMap((e) => [...e.warnings ?? [], ...e.springBone?.warnings ?? []]), a = Vt(t.flatMap((e) => e.activeRoots)), o = t.flatMap((e) => e.managers), s = t.flatMap((e) => e.bones), c = t.flatMap((e) => e.extraBones), l = t.flatMap((e) => e.colliders), u = t.flatMap((e) => e.constraints), d = dt(t), f = je(i, d), p = gt(t, d), m = ht(s, d), h = Be(r);
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
		funit: Re(e),
		raw: ze(t),
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
			warnings: Vt(t.flatMap((e) => Bt(e.setup.constraintSetup?.warnings)))
		},
		managerColliderCaches: p,
		warnings: f
	};
	return Me(t, g, Dt(e)), g;
}
function je(e, t) {
	let n = t.filter((e) => e.sourceKind === "colliderFlag");
	return n.length > 0 && n.every((e) => k(e.colliders).length > 0) ? e.filter((e) => !/has colliderFlag .* but no body colliders matched runtime CL_\* prefixes/.test(e)) : e;
}
function Me(e, t, n) {
	for (let r of e.filter((e) => e.partType === "head_optional")) {
		let i = r.prefabGraph, a = Nt(C(r.runtime.mount?.attachNode)), o = a ? Ne(e, a) : null, s = (i?.transforms ?? []).find((e) => e.parentPathId == null && C(e.transformPath) === "optional");
		if (!i || !o || !s || typeof o.pathId != "number" || typeof s.pathId != "number") {
			t.warnings?.push(`Head optional prefab '${C(r.runtime.part.modelAssetbundleName) || "<unknown>"}' was not instantiated: official prefab root 'optional' or active attach node '${a || "<missing>"}' was not found.`);
			continue;
		}
		let c = (i.monoBehaviours ?? []).find((e) => C(e.scriptName) === "CharacterAccessoryTransformController" && Fe(C(e.transformPath), "optional"));
		if (c) {
			let e = C(c.transformPath), a = (i.transforms ?? []).find((t) => C(t.transformPath) === e);
			a ? (Ie(a, kt(r.runtime, n)), i.headOptionalControllerPath = e) : t.warnings?.push(`Head optional controller target '${e || "<missing>"}' was not found in prefab 'optional'.`);
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
		Pe(i, "optional"), s.parentPathId = o.pathId, o.childPathIds = [.../* @__PURE__ */ new Set([...o.childPathIds ?? [], s.pathId])], i.headOptionalAttachPath = C(o.transformPath), i.headOptionalPrefabRootPath = "optional";
	}
}
function Ne(e, t) {
	for (let n of e) {
		if (n.partType === "head_optional" || !n.prefabGraph) continue;
		let e = n.prefabGraph.transforms ?? [], r = new Map(e.filter((e) => typeof e.pathId == "number").map((e) => [e.pathId, e])), i = new Map(O(n.prefabGraph.gameObjects).map((e) => [Mt(e.pathId, NaN), e.activeSelf !== !1 && e.activeInHierarchy !== !1])), a = (e) => typeof e.gameObjectPathId != "number" || i.get(e.gameObjectPathId) !== !1, o = (e) => {
			if (!a(e)) return null;
			if (C(e.name) === t || Nt(C(e.transformPath)) === t) return e;
			for (let t of e.childPathIds ?? []) {
				let e = r.get(t), n = e ? o(e) : null;
				if (n) return n;
			}
			return null;
		};
		for (let t of n.activeRoots) {
			let n = e.find((e) => e.parentPathId == null && C(e.transformPath) === t), r = n ? o(n) : null;
			if (r) return r;
		}
	}
	return null;
}
function Pe(e, t) {
	let n = (e) => Fe(C(e.transformPath), t);
	e.transforms = (e.transforms ?? []).filter(n), e.gameObjects = O(e.gameObjects).filter(n), e.renderers = O(e.renderers).filter(n), e.animators = O(e.animators).filter(n), e.monoBehaviours = (e.monoBehaviours ?? []).filter(n), e.constraints = O(e.constraints).filter(n), e.rootTransformPathIds = e.transforms.filter((e) => C(e.transformPath) === t).map((e) => e.pathId).filter((e) => typeof e == "number");
}
function Fe(e, t) {
	return e === t || e.startsWith(`${t}/`);
}
function Ie(e, t) {
	let n = jt(t?.position, 0, 0, 0), r = jt(t?.rotationEulerDegrees, 0, 0, 0), i = jt(t?.scale, 1, 1, 1);
	e.localPosition = {
		X: n.x,
		Y: n.y,
		Z: n.z
	}, e.localRotation = Le(r), e.localScale = {
		X: Math.abs(i.x),
		Y: Math.abs(i.y),
		Z: Math.abs(i.z)
	};
}
function Le(e) {
	let t = e.x * Math.PI / 180, n = e.y * Math.PI / 180, r = e.z * Math.PI / 180, i = Math.cos(t / 2), a = Math.cos(n / 2), o = Math.cos(r / 2), s = Math.sin(t / 2), c = Math.sin(n / 2), l = Math.sin(r / 2);
	return {
		x: s * a * o - i * c * l,
		y: i * c * o + s * a * l,
		z: i * a * l + s * c * o,
		w: i * a * o - s * c * l
	};
}
function Re(e) {
	let t = e.map((e) => zt(e.springBone?.funit)).filter((e) => Object.keys(e).length > 0), n = (e, t) => typeof e[t] == "number" && Number.isFinite(e[t]) ? Math.max(Math.trunc(e[t]), 0) : 0, r = Vt(t.flatMap((e) => Bt(e.detectedScripts))).sort((e, t) => e.localeCompare(t));
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
function ze(e) {
	let t = e.filter((e) => e.partType === "body").flatMap((e) => e.extraBones), n = e.filter((e) => e.partType === "head" || e.partType === "hair" || e.partType === "head_optional").flatMap((e) => e.extraBones);
	return {
		body: { extraBones: t },
		head: { extraBones: n }
	};
}
function Be(e) {
	let t = Ve(e), n = He(e);
	return !t || !Ue(e, "face") || !n ? null : {
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
function Ve(e) {
	return ["body/Position/PositionOffset/Hip/Waist/Spine/Chest/Neck", "body/Position/Hip/Waist/Spine/Chest/Neck"].find((t) => Ue(e, t)) ?? null;
}
function He(e) {
	return ["face/Position/Hip/Waist/Spine/Chest/Neck", "face/Position"].find((t) => Ue(e, t)) ?? null;
}
function Ue(e, t) {
	return e.some((e) => O(e?.transforms).some((e) => C(e.transformPath) === t));
}
function We(e) {
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
function Ge(e, t) {
	let n = We(e), r = c(e.part), i = Ke(r, Bt(n.activeRootProfile?.activeRoots)), a = qe(w(n.managers, t, r), i), o = qe(w(n.bones, t, r), i), s = qe(Je(n.extraBones, t, r), i), l = qe(w(n.colliders, t, r), i), u = Xe(w(n.colliderBindings, t, r), o), d = Ze(w(n.managerColliderCaches, t, r), a), f = Qe(n.constraintSetup, t, r, i);
	return et(a, o, d), {
		runtime: e,
		partIndex: t,
		partType: r,
		setup: n,
		prefabGraph: $e(e.springBone?.prefabGraph, t),
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
function Ke(e, t) {
	return e === "body" && t.includes("body") ? ["body"] : (e === "head" || e === "hair") && t.includes("face") ? ["face"] : e === "head_optional" && t.includes("optional") ? ["optional"] : t.length ? [t[0]] : [e === "body" ? "body" : "face"];
}
function qe(e, t) {
	let n = new Set(t.map((e) => Ct(e)));
	return e.filter((e) => {
		let t = Ct(wt(e.nodePath) ?? e.poseRoot);
		return n.has(t);
	});
}
function Je(e, t, n) {
	return w(e, t, n).map((e) => {
		let n = e, r = Ye(n.gameObject ?? n.GameObject, t), i = Ye(n.referenceBone ?? n.ReferenceBone, t);
		return n.gameObject = r, n.GameObject = r, n.referenceBone = i, n.ReferenceBone = i, n.nodePath = r?.transformPath ?? r?.TransformPath ?? null, n.poseRoot = wt(n.nodePath) ?? null, n;
	});
}
function Ye(e, t) {
	if (!D(e)) return e;
	let n = { ...e };
	return typeof n.pathId == "number" && (n.pathId = T(n.pathId, t)), typeof n.PathId == "number" && (n.PathId = T(n.PathId, t)), n;
}
function Xe(e, t) {
	let n = new Set(t.map((e) => e.pathId).filter((e) => typeof e == "number"));
	return e.filter((e) => typeof e.sourceSpringBonePathId != "number" || n.has(e.sourceSpringBonePathId));
}
function Ze(e, t) {
	let n = new Set(t.map((e) => e.pathId).filter((e) => typeof e == "number"));
	return e.filter((e) => typeof e.managerPathId != "number" || n.has(e.managerPathId));
}
function Qe(e, t, n, r) {
	let i = new Set(r.map((e) => Ct(e)));
	return w(e?.constraints, t, n).map((e) => {
		let n = O(e.sources).map((e) => {
			let n = { ...e };
			return typeof n.sourcePathId == "number" && (n.sourcePathId = T(n.sourcePathId, t)), n;
		});
		return typeof e.worldUpObjectPathId == "number" && (e.worldUpObjectPathId = T(e.worldUpObjectPathId, t)), {
			...e,
			sources: n
		};
	}).filter((e) => {
		let t = Ct(wt(e.ownerPath));
		return !t || i.has(t);
	});
}
function $e(e, t) {
	if (!D(e)) return null;
	let n = { ...e };
	return n.runtimePartIndex = t, n.transforms = O(e.transforms).map((e) => {
		let n = {
			...e,
			runtimePartIndex: t
		};
		return typeof n.pathId == "number" && (n.pathId = T(n.pathId, t)), typeof n.PathId == "number" && (n.PathId = T(n.PathId, t)), typeof n.parentPathId == "number" && (n.parentPathId = T(n.parentPathId, t)), Array.isArray(n.childPathIds) && (n.childPathIds = n.childPathIds.map((e) => typeof e == "number" ? T(e, t) : e)), n;
	}), n.monoBehaviours = O(e.monoBehaviours).map((e) => {
		let n = {
			...e,
			runtimePartIndex: t
		};
		return typeof n.pathId == "number" && (n.pathId = T(n.pathId, t)), n;
	}), n;
}
function et(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = n.nodePath, i = t.filter((t) => tt(t.nodePath, e)).map((e) => e.pathId).filter((e) => typeof e == "number");
		i.length && (n.bonePathIds = i, typeof n.pathId == "number" && r.set(n.pathId, i));
	}
	for (let e of n) {
		let t = typeof e.managerPathId == "number" ? r.get(e.managerPathId) : void 0;
		t?.length && (e.springBonePathIds = t);
	}
}
function tt(e, t) {
	return !e || !t ? !1 : e === t || e.startsWith(`${t}/`);
}
function w(e, t, n) {
	return Array.isArray(e) ? e.map((e) => {
		if (!D(e)) return e;
		let r = { ...e };
		return r.runtimePartIndex = t, r.runtimePartType = n, it(r, t), at(r, t), Array.isArray(r.forceProviders) && (r.forceProviders = ot(r.forceProviders, t)), D(r.collidersByRoot) && (r.collidersByRoot = st(r.collidersByRoot, t)), D(r.candidateRoots) && (r.candidateRoots = st(r.candidateRoots, t)), r;
	}) : [];
}
var nt = [
	"pathId",
	"index",
	"managerPathId",
	"pivotSourcePathId",
	"sourceSpringBonePathId"
], rt = [
	"bonePathIds",
	"directColliderPathIds",
	"sourceColliderPathIds",
	"colliders",
	"selectedColliderIndexes",
	"sphereColliderIndexes",
	"capsuleColliderIndexes",
	"panelColliderIndexes",
	"springBonePathIds"
];
function it(e, t) {
	for (let n of nt) typeof e[n] == "number" && (e[n] = T(e[n], t));
}
function at(e, t) {
	for (let n of rt) {
		let r = e[n];
		Array.isArray(r) && (e[n] = r.map((e) => typeof e == "number" ? T(e, t) : e));
	}
}
function ot(e, t) {
	return e.map((e) => {
		if (!D(e)) return e;
		let n = {
			...e,
			runtimePartIndex: t
		};
		return typeof n.sourcePathId == "number" && (n.sourcePathId = T(n.sourcePathId, t)), typeof n.springManagerPathId == "number" && (n.springManagerPathId = T(n.springManagerPathId, t)), n;
	});
}
function T(e, t) {
	return (t + 1) * 1e9 + e;
}
function st(e, t) {
	return Object.fromEntries(Object.entries(e).map(([e, n]) => [e, Array.isArray(n) ? n.map((e) => typeof e == "number" ? T(e, t) : e).filter((e) => typeof e == "number") : []]));
}
var ct = [
	[1, "CL_Hip"],
	[2, "CL_Chest"],
	[4, "CL_Left_Arm"],
	[8, "CL_Right_Arm"],
	[16, "CL_Left_Elbow"],
	[32, "CL_Right_Elbow"]
];
function lt(e) {
	return ct.filter(([t]) => (e & t) !== 0).map(([, e]) => e);
}
function ut(e) {
	return e.flatMap((e) => e.partType === "body" ? [] : e.bones.filter((t) => (t.colliderFlag ?? 0) === 0 || typeof t.pathId != "number" ? !1 : !e.colliderBindings.some((e) => e.sourceSpringBonePathId === t.pathId && (e.sourceKind === "deferred_body_colliderFlag" || e.sourceKind === "colliderFlag"))).map((t) => ({
		sourceKind: "deferred_body_colliderFlag",
		partKind: t.partKind ?? e.partType,
		sourceSpringBonePathId: t.pathId,
		colliderFlag: t.colliderFlag,
		matchedPrefixes: lt(t.colliderFlag ?? 0),
		collidersByRoot: {},
		defaultRoot: "body",
		sourceColliderPathIds: [],
		colliders: [],
		rebindReason: "viewer_synthesized_missing_colliderFlag_binding"
	})));
}
function dt(e) {
	let t = e.filter((e) => e.partType === "body").flatMap((e) => e.colliders), n = yt(t);
	return ut(e).map((e) => ft(e, t)).concat(e.flatMap((e) => e.colliderBindings.map((r) => {
		if (r.sourceKind === "deferred_body_colliderFlag" && e.partType !== "body") return ft(r, t);
		if (r.sourceKind !== "colliderFlag" || e.partType === "body" || !bt(n)) return r;
		let i = xt(n);
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
function ft(e, t) {
	let n = pt(e, t);
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
function pt(e, t) {
	let n = Bt(e.matchedPrefixes), r = yt(t.filter((e) => typeof e.index == "number" && mt(e, n))), i = bt(r) ? xt(r).root : Ct(e.defaultRoot ?? "body");
	return {
		byRoot: r,
		defaultRoot: i,
		indexes: r[i] ?? []
	};
}
function mt(e, t) {
	if (!t.length) return !1;
	let n = C(e.nodeName);
	return t.some((e) => n.startsWith(e));
}
function ht(e, t) {
	let n = new Map(e.filter((e) => typeof e.pathId == "number").map((e) => [e.pathId, e]));
	return t.filter((e) => typeof e.sourceSpringBonePathId == "number").map((e) => {
		let t = n.get(e.sourceSpringBonePathId), r = bt(e.collidersByRoot) ? e.collidersByRoot : { [e.defaultRoot ?? t?.poseRoot ?? "unknown"]: e.colliders ?? [] };
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
function gt(e, t) {
	let n = new Map(e.flatMap((e) => e.colliders).filter((e) => typeof e.index == "number").map((e) => [e.index, e]));
	return e.flatMap((e) => e.managerColliderCaches.map((r) => e.partType === "head" || e.partType === "hair" ? _t(r, t, n) : vt(r, n)));
}
function _t(e, t, n) {
	let r = new Set(k(e.springBonePathIds)), i = Ht(t.filter((e) => typeof e.sourceSpringBonePathId == "number" && r.has(e.sourceSpringBonePathId) && e.sourceKind === "colliderFlag").flatMap((e) => k(e.colliders)).filter((e) => n.has(e)));
	return i.length ? {
		...e,
		sphereColliderIndexes: i.filter((e) => C(n.get(e)?.scriptName).includes("Sphere")),
		capsuleColliderIndexes: i.filter((e) => C(n.get(e)?.scriptName).includes("Capsule")),
		panelColliderIndexes: i.filter((e) => C(n.get(e)?.scriptName).includes("Panel")),
		reason: "viewer_composed_head_body_collider_cache"
	} : vt(e, n);
}
function vt(e, t) {
	return {
		...e,
		sphereColliderIndexes: k(e.sphereColliderIndexes).filter((e) => t.has(e)),
		capsuleColliderIndexes: k(e.capsuleColliderIndexes).filter((e) => t.has(e)),
		panelColliderIndexes: k(e.panelColliderIndexes).filter((e) => t.has(e)),
		reason: "viewer_composed_active_parts_manager_cache"
	};
}
function yt(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		if (typeof n.index != "number") continue;
		let e = Ct(wt(n.nodePath) ?? n.poseRoot ?? "body"), r = t.get(e) ?? [];
		r.push(n.index), t.set(e, r);
	}
	return Object.fromEntries([...t.entries()].map(([e, t]) => [e, [...new Set(t)].sort((e, t) => e - t)]));
}
function bt(e) {
	return !!(e && Object.values(e).some((e) => e.length > 0));
}
function xt(e) {
	let [t, n] = Object.entries(e).sort(([e], [t]) => St(e) - St(t) || e.localeCompare(t))[0];
	return {
		root: t,
		indexes: n
	};
}
function St(e) {
	return e === "body" ? 0 : e === "sit_body" ? 1 : e === "guitar_body" ? 2 : 10;
}
function Ct(e) {
	return (e ?? "").trim() || "body";
}
function wt(e) {
	return e?.split("/").find(Boolean) ?? null;
}
function Tt(e, t) {
	let n = [...t.warnings ?? []], r = [];
	for (let [i, a] of e.entries()) {
		let e = c(a.part);
		for (let o of O(a.nativeMeshes?.meshes)) {
			let a = Et(o, i);
			if (e !== "head_optional") {
				r.push(a);
				continue;
			}
			let s = C(a.rendererTransformPath), c = O(t.prefabGraphs).find((e) => Mt(e.runtimePartIndex, -1) === i && !!C(e.headOptionalAttachPath)), l = C(c?.headOptionalPrefabRootPath);
			if (!c || !l) {
				n.push(`Head optional mesh '${C(o.meshPath) || C(o.meshName) || "<unnamed>"}' was skipped because the official prefab could not be mounted.`);
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
function Et(e, t) {
	let n = { ...e };
	for (let e of [
		"rendererPathId",
		"rendererTransformPathId",
		"rootBonePathId"
	]) typeof n[e] == "number" && (n[e] = T(n[e], t));
	return Array.isArray(n.bonePathIds) && (n.bonePathIds = n.bonePathIds.map((e) => typeof e == "number" ? T(e, t) : e)), n;
}
function Dt(e) {
	let t = [
		...e.filter((e) => c(e.part) === "head"),
		...e.filter((e) => c(e.part) === "hair"),
		...e.filter((e) => c(e.part) !== "head_optional")
	];
	for (let e of t) {
		let t = Ot(C(e.source?.bundlePath));
		if (t) return t;
		let n = Ot(C(e.part.modelAssetbundleName));
		if (n) return n;
	}
	return null;
}
function Ot(e) {
	let t = e.replace(/\\/g, "/").replace(/\.bundle$/i, "").match(/(?:^|\/)face\/([^/]+)\/([^/]+)$/i);
	return t ? `${t[1]}/${t[2]}` : null;
}
function kt(e, t) {
	if (!t) return null;
	let n = At(e)[t];
	return D(n) ? n : null;
}
function At(e) {
	return zt(e.mount?.accessoryTransformAdjustments);
}
function jt(e, t, n, r) {
	let i = zt(e);
	return {
		x: Mt(i.x ?? i.X, t),
		y: Mt(i.y ?? i.Y, n),
		z: Mt(i.z ?? i.Z, r)
	};
}
function Mt(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function Nt(e) {
	return (e?.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? "") || null;
}
function Pt(e, t, n) {
	if (!t) return e;
	let r = Ft([], [t], n), i = new Map(r.filter((e) => e.materialKind === "eye" || e.materialKind === "eyelight").map((e) => [e.materialKind, e]));
	return e.map((e) => {
		if (e.mainTex || e.materialKind !== "eye" && e.materialKind !== "eyelight") return e;
		let t = i.get(e.materialKind);
		return t?.mainTex ? {
			...e,
			mainTex: t.mainTex
		} : e;
	});
}
function Ft(e, t, n) {
	let r = t.flatMap((e) => {
		let t = be(e, n);
		return (e.materialSlots ?? []).map((e) => It(e, t));
	});
	if (r.length) return r;
	let i = t[0] ? be(t[0], n) : n;
	return [...e ?? []].map((e) => It(e, i));
}
function It(e, t) {
	return {
		...e,
		mainTex: E(e.mainTex ?? void 0, t) ?? e.mainTex,
		shadowTex: E(e.shadowTex ?? void 0, t) ?? e.shadowTex,
		valueTex: E(e.valueTex ?? void 0, t) ?? e.valueTex,
		faceShadowTex: E(e.faceShadowTex ?? void 0, t) ?? e.faceShadowTex,
		rawMaterial: e.rawMaterial ? {
			...e.rawMaterial,
			textureProperties: e.rawMaterial.textureProperties.map((e) => ({
				...e,
				uri: E(e.uri ?? void 0, t) ?? e.uri
			}))
		} : e.rawMaterial
	};
}
function E(e, t) {
	return e && t(e);
}
function Lt(e, t) {
	return e ? t(e) : "";
}
function Rt(e) {
	return JSON.parse(JSON.stringify(e));
}
function D(e) {
	return !!(e && typeof e == "object" && !Array.isArray(e));
}
function zt(e) {
	return D(e) ? e : {};
}
function Bt(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "string") : [];
}
function O(e) {
	return Array.isArray(e) ? e.filter((e) => D(e)) : [];
}
function k(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "number") : [];
}
function Vt(e) {
	return [...new Set(e)];
}
function Ht(e) {
	return [...new Set(e)].sort((e, t) => e - t);
}
var Ut = {
	discardResolvedDeferredColliderWarnings: je,
	mountHeadOptionalPrefabGraphs: Me,
	findHeadOptionalAttachTransform: Ne,
	retainHeadOptionalPrefabSubtree: Pe,
	isSameOrDescendantPath: Fe,
	applyAccessoryControllerTransform: Ie,
	unityQuaternionFromEulerDegrees: Le,
	mergeRuntimeFUnitSummaries: Re,
	mergeRuntimeRawSpringBone: ze,
	resolveComposedBodyHeadAssembly: Be,
	resolveComposedBodyAttachPath: Ve,
	resolveComposedHeadOriginPath: He,
	hasRuntimeSetupTransformPath: Ue,
	getPartRuntimeSetup: We,
	remapRuntimePart: Ge,
	selectRuntimePartActiveRoots: Ke,
	filterRuntimeRecordsByActiveRoots: qe,
	remapRuntimeExtraBones: Je,
	remapRuntimeObjectRef: Ye,
	filterColliderBindingsByActiveBones: Xe,
	filterManagerColliderCachesByActiveManagers: Ze,
	remapRuntimeConstraints: Qe,
	remapPrefabGraph: $e,
	withInferredSpringManagerBoneRefs: et,
	isSameOrDescendantRuntimePath: tt,
	cloneArrayWithPartPrefix: w,
	remapScalarFields: it,
	remapArrayFields: at,
	remapRuntimeForceProviders: ot,
	remapNumericId: T,
	remapColliderRoots: st,
	synthesizeMissingColliderFlagBindings: ut,
	rebuildColliderBindings: dt,
	rebuildDeferredColliderFlagBinding: ft,
	selectBodyCollidersForColliderFlag: pt,
	matchesColliderFlagPrefix: mt,
	rebuildBindingDecisions: ht,
	rebuildManagerColliderCaches: gt,
	rebuildHeadManagerColliderCache: _t,
	filterManagerCache: vt,
	collidersByRoot: yt,
	hasColliderRoots: bt,
	firstColliderRoot: xt,
	rootPriority: St,
	normalizeRootName: Ct,
	firstPathSegment: wt,
	mergeNativeMeshes: Tt,
	remapNativeMeshIds: Et,
	resolveHeadOptionalFaceId: Dt,
	extractFaceIdFromBundlePath: Ot,
	resolveAccessoryTransformAdjustment: kt,
	readAccessoryTransformAdjustments: At,
	readVectorLike: jt,
	readNumber: Mt,
	normalizePathSegment: Nt,
	inheritMissingRoleEyeTextures: Pt,
	mergeMaterialSlots: Ft,
	resolveMaterialSlotTextureUrls: It,
	resolveMaybeUrl: E,
	resolveRequiredUrl: Lt,
	cloneRecord: Rt,
	isRecord: D,
	asRecord: zt,
	readStringArray: Bt,
	readRecordArray: O,
	readNumberArray: k,
	uniqueStrings: Vt,
	uniqueNumbers: Ht
}, Wt = class {
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
		if (this.assertSameActiveCharacter(n), await this.ensureSelectionPackages(n), await this.options.ensureCompatibility?.(n), !t()) throw Gt();
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
		let t = ne(this.partSet, e);
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
		let t = ne(this.partSet, e), n = this.partSet.roles.find((t) => f(t.characterId, t.unit) === f(e.characterId, e.unit)), r = [
			this.findRegistryEntry(e, "body", e.bodyCostume3dId),
			n ? this.findRegistryEntry(e, "body", n.bodyCostume3dId) : null,
			t,
			this.findRegistryEntry(e, "hair", e.hairCostume3dId),
			ae(this.partSet, e),
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
function Gt() {
	let e = /* @__PURE__ */ Error("Custom part selection was superseded by a newer request.");
	return e.name = "AbortError", e;
}
//#endregion
//#region src/runtime/brotliWasmAsset.ts
var Kt = "" + new URL("assets/brotli_wasm_bg-NfWIZley.wasm", import.meta.url).href, qt = 64 * 1024, Jt = 3e4, A = null, Yt = 1, j = /* @__PURE__ */ new Map(), M = null;
async function Xt(e) {
	if (e.byteLength < qt || typeof Worker > "u") return Zt(e);
	let t = Qt();
	if (!t) return Zt(e);
	let n = Yt++;
	return new Promise((r, i) => {
		j.set(n, {
			resolve: r,
			reject: i
		}), j.size === 1 && $t(), t.postMessage({
			id: n,
			bytes: e,
			wasmUrl: Kt
		}, [e]);
	});
}
async function Zt(e) {
	let { decodeRuntimeMessagePackBrotliDirect: t } = await import("./runtimeMessagePackDecodeCore-BptdOkvu.js");
	return t(e, Kt);
}
function Qt() {
	if (A) return A;
	try {
		return A = new Worker(new URL(
			/* @vite-ignore */
			"" + new URL("assets/runtimeDecodeWorker-CzgHFjDH.js", import.meta.url).href,
			"" + import.meta.url
		), {
			type: "module",
			name: "haruki-runtime-decoder"
		}), A.onmessage = ({ data: e }) => {
			let t = j.get(e.id);
			t && (j.delete(e.id), j.size === 0 ? en() : $t(), e.error ? t.reject(Error(e.error)) : t.resolve(e.value));
		}, A.onerror = () => tn("Runtime decode worker failed."), A;
	} catch {
		return A = null, null;
	}
}
function $t() {
	M !== null && clearTimeout(M), M = setTimeout(() => {
		M = null, tn(`Runtime decode worker made no progress within ${Jt} ms; rejecting ${j.size} pending decode(s).`);
	}, Jt);
}
function en() {
	M !== null && (clearTimeout(M), M = null);
}
function tn(e) {
	en(), A?.terminate(), A = null;
	for (let t of j.values()) t.reject(Error(e));
	j.clear();
}
//#endregion
//#region src/runtime/runtimePackageLoader.ts
var N = /* @__PURE__ */ new Map(), nn = 16, rn = /* @__PURE__ */ new Map();
async function an(e, t) {
	let n = /* @__PURE__ */ new Map(), r = await sn(e, t), i = new Wt({
		resolveUrl: (t) => P(e, t),
		loadPartRuntime: async (t) => fn(r, t, e),
		ensureCompatibility: async (t) => hn(r, t.unit, e)
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
function P(e, t) {
	let n = new URL(e, window.location.href);
	n.pathname.endsWith("/") || (n.pathname = `${n.pathname}/`);
	let r = t.replace(/\\/g, "/").replace(/^\/+/, "").split("/").filter((e) => e.length > 0);
	if (r.length === 0 || r.some((e) => e === "." || e === "..")) throw Error(`Invalid runtime package relative path: ${t}`);
	let i = r.map((e) => encodeURIComponent(e)).join("/");
	return new URL(i, n).toString();
}
function on(e, t) {
	if (!t) return e;
	let n = new URL(e, window.location.href);
	return n.searchParams.set("masterVersion", t), n.toString();
}
async function sn(e, t) {
	let n = gn(t.roleId), r = `parts/by-role/${n.characterId}/${bn(n.unit)}`, i = await F(P(e, `${r}/runtime-role-catalog.msgpack.br`)), a = _n(i, n.characterId, n.unit), o = Tn(await F(on(P(e, `${r}/part-registry.msgpack.br`), i.masterVersion))), s = /* @__PURE__ */ new Map();
	if (t.deferDefaultSelection) return {
		registry: o,
		roles: a,
		masterVersion: i.masterVersion,
		compatibility: null,
		packages: s,
		roleRuntimes: /* @__PURE__ */ new Map(),
		baseUrl: e
	};
	let c = An(o, a, null);
	for (let t = 0; t < Math.min(c.length, 720); t += 24) {
		let n = c.slice(t, t + 24), r = await Promise.all(n.map(async (t) => ({
			entry: t,
			runtime: await mn(e, t)
		})));
		for (let e of r) e.runtime && s.set(e.entry.packagePath, xn(e.runtime, e.entry));
		if (Nn(o, a, null, s, e)) break;
	}
	if (!Nn(o, a, null, s, e)) throw Error(`Part registry package did not expose a compatible loaded body/head/hair selection from ${e}.`);
	let l = p({
		registry: o,
		roles: a,
		compatibility: null,
		packages: s,
		roleRuntimes: /* @__PURE__ */ new Map(),
		baseUrl: e
	}), u = l ? /* @__PURE__ */ new Set([f(l.characterId, l.unit)]) : null, d = await ln(e, a, i.masterVersion, u);
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
async function cn(e, t, n) {
	let r = f(t, n), i = e.roleRuntimes.get(r);
	if (i) return i;
	let a = e.roles.find((e) => e.roleRuntimePath && e.characterId === t && f(e.characterId, e.unit ?? null) === r);
	if (!a?.roleRuntimePath) return null;
	let o = await wn(on(P(e.baseUrl, a.roleRuntimePath), e.masterVersion));
	if (!o) return null;
	let s = un(e.baseUrl, a.roleRuntimePath, o, e.masterVersion), c = s.role?.characterId ?? t, l = s.role?.unit ?? n;
	return e.roleRuntimes.set(f(c, l), s), s;
}
async function ln(e, t, n, r = null) {
	let i = /* @__PURE__ */ new Map(), a = t.filter((e) => e.roleRuntimePath && (!r || r.has(f(e.characterId, e.unit ?? null)))), o = await Promise.all(a.map(async (t) => ({
		entry: t,
		runtime: await wn(on(P(e, t.roleRuntimePath), n))
	})));
	for (let t of o) {
		if (!t.runtime) continue;
		let r = t.runtime.role?.characterId ?? t.entry.characterId, a = t.runtime.role?.unit ?? t.entry.unit ?? null, o = un(e, t.entry.roleRuntimePath, t.runtime, n);
		i.set(f(r, a), o);
	}
	return i;
}
function un(e, t, n, r) {
	let i = n.motionPackage, a = i?.unityMotionJson;
	if (!a) return n;
	let o = /^[a-z][a-z0-9+.-]*:/i.test(a) || a.startsWith("/") ? new URL(a, window.location.href).toString() : P(e, dn(t, a));
	return {
		...n,
		motionPackage: {
			...i,
			unityMotionJson: on(o, r)
		}
	};
}
function dn(e, t) {
	let n = e.replace(/\\/g, "/").split("/").slice(0, -1).join("/");
	return n ? `${n}/${t.replace(/^\/+/, "")}` : t;
}
async function fn(e, t, n = e.baseUrl) {
	let r = e.packages.get(t.packagePath);
	if (r) return r;
	let i = xn(await pn(n, t), t);
	return e.packages.set(t.packagePath, i), i;
}
async function pn(e, t) {
	let n = await F(P(e, `${t.packagePath}/part-runtime.msgpack.br`));
	if (!n.corePath?.endsWith(".msgpack.br")) throw Error(`Part runtime must reference a .msgpack.br shared core: ${t.packagePath}.`);
	return a(n, await F(P(e, n.corePath)));
}
async function mn(e, t) {
	try {
		return await pn(e, t);
	} catch {
		return null;
	}
}
async function hn(e, t, n = e.baseUrl) {
	e.compatibility ||= await F(on(P(n, `parts/compat/by-unit/${bn(t)}/head-hair-compatibility.msgpack.br`), e.masterVersion));
}
function gn(e) {
	if (!e) throw Error("Runtime role id is required.");
	let [t, ...n] = e.split(":"), r = Number(t);
	if (!Number.isInteger(r) || r <= 0) throw Error(`Invalid runtime role id: ${e}`);
	return {
		characterId: r,
		unit: n.join(":") || null
	};
}
function _n(e, t, n) {
	let r = (e?.version === 2 || e?.version === 3 || e?.version === 4) && typeof e.masterVersion == "string" && e.masterVersion.length > 0 && Array.isArray(e.roles) ? e.roles : [];
	if (r.length !== 1) throw Error(`Runtime role catalog must contain exactly one scoped role for ${f(t, n)}.`);
	let i = r[0], a = yn(i.roleId), o = a ? `roles/${a.characterId}/${bn(a.unit)}/role-runtime.msgpack.br` : "";
	if (!a || i.characterId !== t || f(i.characterId, i.unit) !== f(t, n) || i.characterId !== a.characterId || f(i.characterId, i.unit) !== f(a.characterId, a.unit) || !Number.isInteger(i.roleId) || i.roleId < 1 || i.roleId > 31 || !Number.isInteger(i.bodyCostume3dId) || i.bodyCostume3dId <= 0 || !Number.isInteger(i.headCostume3dId) || i.headCostume3dId <= 0 || !Number.isInteger(i.hairCostume3dId) || i.hairCostume3dId <= 0 || e.version >= 3 && !vn(i.skinColors) || e.version >= 4 && (typeof i.characterHeightMeters != "number" || !Number.isFinite(i.characterHeightMeters) || i.characterHeightMeters <= 0) || i.roleRuntimePath !== o) throw Error(`Runtime role catalog is invalid for ${f(t, n)}.`);
	return r;
}
function vn(e) {
	let t = (e) => typeof e == "string" && /^#[0-9a-f]{6}$/i.test(e);
	return !!(e && t(e.default) && t(e.shadow1) && t(e.shadow2));
}
function yn(e) {
	return !Number.isInteger(e) || e < 1 || e > 31 ? null : e <= 20 ? {
		characterId: e,
		unit: [
			"light_sound",
			"idol",
			"street",
			"theme_park",
			"school_refusal"
		][Math.floor((e - 1) / 4)]
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
function bn(e) {
	return e || "default";
}
function xn(e, t) {
	return {
		...e,
		packagePath: t.packagePath,
		mount: {
			...e.mount ?? {},
			packagePath: t.packagePath
		}
	};
}
async function F(e) {
	if (!/\.msgpack\.br(?:[?#]|$)/i.test(e)) throw Error(`Runtime metadata must use .msgpack.br: ${e}`);
	let t = rn.get(e);
	if (t) return t;
	let n = (async () => {
		let t = await fetch(e);
		if (!t.ok) throw Error(`Failed to load ${e}: HTTP ${t.status}`);
		return Sn(t, e);
	})();
	rn.set(e, n);
	try {
		return await n;
	} finally {
		rn.get(e) === n && rn.delete(e);
	}
}
async function Sn(e, t) {
	try {
		let n = e.headers.get("x-haruki-file-version"), r = n && Cn(t) ? N.get(t) : null;
		if (r?.version === n) return N.delete(t), N.set(t, r), await e.body?.cancel(), r.value;
		let i = await Xt(await e.arrayBuffer());
		if (n && Cn(t)) for (N.delete(t), N.set(t, {
			version: n,
			value: i
		}); N.size > nn;) N.delete(N.keys().next().value);
		return i;
	} catch (e) {
		throw e instanceof Error ? e : /* @__PURE__ */ Error(`Failed to decode ${t}: ${String(e)}`);
	}
}
function Cn(e) {
	let t = e.split(/[?#]/, 1)[0] ?? e;
	return /\/parts\/by-role\/[^/]+\/[^/]+\/(?:part-registry|runtime-role-catalog)\.msgpack\.br$/.test(t) || /\/parts\/compat\/by-unit\/[^/]+\/head-hair-compatibility\.msgpack\.br$/.test(t) || /\/roles\/[^/]+\/[^/]+\/(?:role-runtime|motion\/unity-motion)\.msgpack\.br$/.test(t);
}
async function wn(e) {
	try {
		return await F(e);
	} catch {
		return null;
	}
}
function Tn(e) {
	return Array.isArray(e) ? e : e.entries ?? e.parts ?? [];
}
function En(e, t, n, r, i) {
	return e.find((e) => e.characterId === t && e.costume3dId === r && l(e) === n && (i === void 0 || e.unit === i) && jn(e));
}
function Dn(e, t, n, r) {
	let i = (t, n, r, i) => En(e, t, n, r, i);
	for (let e of t) e.characterId === n && (typeof e.bodyCostume3dId == "number" && r(i(e.characterId, "body", e.bodyCostume3dId, e.unit)), typeof e.headCostume3dId == "number" && (r(i(e.characterId, "head", e.headCostume3dId, e.unit)), r(i(e.characterId, "head_optional", e.headCostume3dId, e.unit))), typeof e.hairCostume3dId == "number" && r(i(e.characterId, "hair", e.hairCostume3dId, e.unit)));
}
function On(e, t, n, r) {
	let i = e.filter((e) => e.characterId === t && ["head", "head_optional"].includes(l(e) ?? "") && jn(e)).sort((e, t) => e.costume3dId - t.costume3dId), a = e.filter((e) => e.characterId === t && l(e) === "hair" && jn(e)).sort((e, t) => e.costume3dId - t.costume3dId);
	for (let e of i) for (let t of a) l(e) !== "head" && n.has(he(e.unit ?? t.unit, e.costume3dId, t.costume3dId)) || (r(e), r(t));
}
function kn(e, t) {
	let n = /* @__PURE__ */ new Set();
	for (let r of e) if (!(t !== null && r.characterId !== t)) for (let e of [
		r.bodyCostume3dId,
		r.headCostume3dId,
		r.hairCostume3dId
	]) typeof e == "number" && n.add(e);
	return n;
}
function An(e, t, n) {
	let r = t.find((e) => typeof e.characterId == "number")?.characterId ?? e.find(Mn)?.characterId ?? null, i = [], a = /* @__PURE__ */ new Set(), o = (e) => {
		if (!e || !Mn(e)) return;
		let t = e.packagePath;
		a.has(t) || (a.add(t), i.push(e));
	}, s = me(n);
	r !== null && (Dn(e, t, r, o), o(e.filter((e) => e.characterId === r && l(e) === "body" && jn(e)).sort((e, t) => e.costume3dId - t.costume3dId)[0]), On(e, r, s, o));
	let c = kn(t, r), u = e.filter(Mn).filter((e) => !a.has(e.packagePath)).map((e, t) => ({
		entry: e,
		index: t,
		score: (r !== null && e.characterId === r ? 0 : 1e6) + (c.has(e.costume3dId) ? 0 : 1e4) + Pn(e) + Math.min(e.costume3dId, 9999)
	})).sort((e, t) => e.score - t.score || e.index - t.index);
	return [...i, ...u.map((e) => e.entry)];
}
function jn(e) {
	return e.status !== "missing";
}
function Mn(e) {
	return jn(e) && e.status !== "empty";
}
function Nn(e, t, n, r, i) {
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
function Pn(e) {
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
var Fn = /* @__PURE__ */ function(e) {
	return e[e.NoCollision = 0] = "NoCollision", e[e.HeadIsEmbedded = 1] = "HeadIsEmbedded", e[e.TailCollision = 2] = "TailCollision", e;
}({}), I = 1e-5, In = .001, Ln = new e.Vector3(1, 0, 0);
function Rn(t, n) {
	return {
		currTipPos: n.clone(),
		prevTipPos: n.clone(),
		hitNormal: new e.Vector3(0, 0, 0),
		cachedPosition: t.clone(),
		cachedMovement: new e.Vector3(0, 0, 0)
	};
}
function zn(e) {
	let t = e.parentRotation.clone().multiply(e.initialLocalRotation), n = e.boneAxis.clone().applyQuaternion(t);
	return e.headPosition.clone().addScaledVector(n, e.springLength);
}
function Bn(e, t) {
	let n = e.currTipPos.clone(), r = zn(t).sub(e.currTipPos).multiplyScalar(t.stiffnessForce), i = t.springForce.clone().add(t.externalForce).add(r), a = e.currTipPos.clone().sub(e.prevTipPos).multiplyScalar(1 - t.dragForce);
	e.currTipPos.add(a).addScaledVector(i, t.deltaTime * t.deltaTime * .5), e.prevTipPos.copy(n), Hn(e.currTipPos, t.headPosition, t.springLength, t.lengthFallbackDirection ?? t.boneAxis);
}
function Vn(e, t) {
	e.cachedMovement.copy(t).sub(e.cachedPosition), e.cachedPosition.copy(t);
}
function Hn(e, t, n, r = Ln) {
	let i = e.clone().sub(t);
	i.lengthSq() <= In * In && i.copy(r), i.normalize(), e.copy(t).addScaledVector(i, n);
}
function Un(t, n, r, i, a, o = Ln) {
	let s = r.clone().sub(n), c = s.length();
	if (c <= In) {
		s.copy(o).normalize(), t.copy(n).addScaledVector(s, i);
		return;
	}
	let l = e.MathUtils.clamp(c, i, a);
	t.copy(n).addScaledVector(s, l / c);
}
function Wn(t) {
	if (t.targets.length === 0) return;
	let n = t.springConstant * t.deltaTime * t.deltaTime, r = new e.Vector3();
	for (let e of t.targets) {
		let i = t.currTipPos.clone().sub(e.position), a = i.length();
		if (a <= I) continue;
		let o = a - e.initialLength;
		r.addScaledVector(i, -(n * o) / a);
	}
	t.currTipPos.add(r);
}
function Gn(e, t) {
	let n = 0, r = null;
	e.currTipPos.clone();
	for (let i of fr(t.colliders)) {
		if (i.enabled === !1) continue;
		let a = Jn(i, t.headPosition, e.currTipPos, t.tailRadius, t.springLength);
		t.onColliderCheck?.(i, {
			status: a.status,
			beforeTailPosition: e.currTipPos.clone(),
			afterTailPosition: a.tailPosition.clone(),
			hitNormal: a.hitNormal.clone(),
			details: Kn(i, t.headPosition, e.currTipPos, a.tailPosition, t.tailRadius)
		}), a.status !== 0 && (e.currTipPos.copy(a.tailPosition), e.hitNormal.copy(a.hitNormal), r = a.hitNormal, n = a.status, t.onCollision?.(i, a));
	}
	return r && cr(e, r, t.bounce, t.friction), n;
}
function Kn(e, t, n, r, i) {
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
function qn(e, t) {
	let n = t.headPosition.clone();
	n.y -= t.groundHeight;
	let r = e.currTipPos.clone();
	return r.y -= t.groundHeight, $n(n, e.currTipPos.distanceTo(t.headPosition), r, t.tailRadius, 1) === 0 ? !1 : (r.y += t.groundHeight, Un(e.currTipPos, t.headPosition, r, t.springLength * .5, t.springLength, t.lengthFallbackDirection), e.prevTipPos.copy(e.currTipPos), e.hitNormal.set(0, 1, 0), !0);
}
function Jn(e, t, n, r, i) {
	return e.kind === "sphere" ? tr(t, n, r, e) : e.kind === "capsule" ? nr(t, n, r, e.start, e.end, e.radius) : e.kind === "panel" ? Yn(t, n, r, i, e) : rr(t, n, r, e);
}
function Yn(t, n, r, i, a) {
	let o = n.clone().applyMatrix4(a.worldToLocalMatrix), s = r * a.worldToLocalRadiusScale;
	if (o.z >= s) return L(n);
	let c = a.width * .5, l = a.height * .5;
	if (Math.abs(o.x) >= c + s || Math.abs(o.y) >= l + s) return L(n);
	let u = t.clone().applyMatrix4(a.worldToLocalMatrix), d = i * a.worldToLocalLengthScale, f = o.clone(), p = o.z > 0 || u.z > 0 ? Xn(u, o, f, d, s, c, l) : Qn(u, o, f, s, c, l);
	return p === 0 ? L(n) : {
		status: p,
		tailPosition: f.applyMatrix4(a.localToWorldMatrix),
		hitNormal: mr(new e.Vector3(0, 0, 1), a.localToWorldMatrix)
	};
}
function Xn(t, n, r, i, a, o, s) {
	if (Math.abs(n.y) <= s && Math.abs(n.x) <= o) return $n(t, i, r, a, 2);
	if (Math.abs(n.y) > s) {
		let t = n.y >= 0 ? s : -s, i = Zn(new e.Vector3(0, n.y - t, n.z));
		return r.set(n.x + i.x * a, t + i.y * a, i.z * a), 2;
	}
	let c = n.x >= 0 ? o : -o, l = Zn(new e.Vector3(n.x - c, 0, n.z));
	return r.set(c + l.x * a, n.y + l.y * a, l.z * a), 2;
}
function Zn(e) {
	return e.lengthSq() <= I * I ? e.set(0, 0, 0) : e.normalize();
}
function Qn(e, t, n, r, i, a) {
	return Math.abs(e.y) > a ? (n.set(t.x, t.y >= 0 ? a : -a, t.z), 2) : Math.abs(e.x) <= i ? (n.set(e.x, e.y, r), 1) : (n.set(t.x < 0 ? -i : i, t.y, t.z), 2);
}
function $n(e, t, n, r, i) {
	if (z(n, i) >= r) return 0;
	let a = z(e, i);
	if (a + t <= r) return n.copy(e), hr(n, i, a + t), 1;
	let o = (i + 1) % 3, s = (i + 2) % 3, c = z(n, o) - z(e, o), l = z(n, s) - z(e, s), u = Math.sqrt(c * c + l * l);
	if (u > .001) {
		let d = a - r, f = Math.sqrt(t * t - d * d) / u;
		hr(n, o, z(e, o) + c * f), hr(n, s, z(e, s) + l * f), hr(n, i, r);
	} else n.copy(e);
	return 2;
}
function er(t, n, r, i, a, o = a, s = {}) {
	let c = r + a, l = n.clone().sub(i);
	if (l.lengthSq() >= c * c) return L(n);
	if (t.distanceToSquared(i) <= o * o) {
		let n = s.headEmbeddedFallback === !1 ? l.clone().multiplyScalar(1 / Math.sqrt(l.lengthSq())) : R(l, s.headEmbeddedFallback instanceof e.Vector3 ? s.headEmbeddedFallback : t.clone().sub(i).lengthSq() <= I * I ? new e.Vector3(0, 1, 0) : t.clone().sub(i));
		return {
			status: 1,
			tailPosition: i.clone().addScaledVector(n, c),
			hitNormal: n
		};
	}
	let u = or(t, n.distanceTo(t), i, c);
	if (!u) return s.noIntersectionStatus === 2 ? {
		status: 2,
		tailPosition: n.clone(),
		hitNormal: R(n.clone().sub(i), l)
	} : L(n);
	let d = sr(u, n);
	return {
		status: 2,
		tailPosition: d,
		hitNormal: R(d.clone().sub(i), l)
	};
}
function tr(e, t, n, r) {
	let i = e.clone().applyMatrix4(r.worldToLocalMatrix), a = t.clone().applyMatrix4(r.worldToLocalMatrix), o = n * r.worldToLocalRadiusScale, s = r.radius, c = er(i, a, o, r.localOffset, s, s, {
		headEmbeddedFallback: !1,
		noIntersectionStatus: 2
	});
	return c.status === 0 ? L(t) : {
		status: c.status,
		tailPosition: c.tailPosition.clone().applyMatrix4(r.localToWorldMatrix),
		hitNormal: mr(c.hitNormal.clone(), r.localToWorldNormalMatrix)
	};
}
function nr(t, n, r, i, a, o) {
	let s = a.clone().sub(i), c = s.lengthSq();
	if (c <= I * I) return er(t, n, r, i, o);
	let l = e.MathUtils.clamp(n.clone().sub(i).dot(s) / c, 0, 1), u = i.clone().addScaledVector(s, l), d = r + o, f = n.clone().sub(u);
	if (f.lengthSq() >= d * d) return L(n);
	if (l <= I) return er(t, n, r, i, o);
	if (l >= 1 - I) return er(t, n, r, a, o);
	let p = R(f, t.clone().sub(u)), m = e.MathUtils.clamp(t.clone().sub(i).dot(s) / c, 0, 1), h = i.clone().addScaledVector(s, m);
	return {
		status: t.distanceToSquared(h) <= o * o ? 1 : 2,
		tailPosition: u.addScaledVector(p, d),
		hitNormal: p
	};
}
function rr(e, t, n, r) {
	let i = ir(e.clone().applyMatrix4(r.worldToLocalMatrix), t.clone().applyMatrix4(r.worldToLocalMatrix), n * r.worldToLocalRadiusScale, r.localStart, r.localEnd, r.radius, 1);
	if (i.status === 0) return L(t);
	let a = i.tailPosition.clone().applyMatrix4(r.localToWorldMatrix), o = mr(i.hitNormal, r.localToWorldNormalMatrix);
	return {
		status: i.status,
		tailPosition: a,
		hitNormal: o
	};
}
function ir(t, n, r, i, a, o, s = 1) {
	if (o <= 1e-4) return L(n);
	let c = i.y <= a.y ? i : a, l = i.y <= a.y ? a : i, u = c.y, d = l.y;
	return n.y <= u || n.y >= d ? er(t, n, r, n.y < d ? c : l, o, Math.abs(s) * o, {
		headEmbeddedFallback: new e.Vector3(0, 0, 0),
		noIntersectionStatus: 2
	}) : ar(t, n, r, o, s);
}
function ar(t, n, r, i, a = 1) {
	let o = i + r, s = n.x * n.x + n.z * n.z;
	if (s > o * o) return L(n);
	let c = Math.sqrt(s), l = c > I ? n.x / c : 0, u = c > I ? n.z / c : 0, d = new e.Vector3(o * l, n.y, o * u), f = new e.Vector3(l, 0, u), p = t.x * t.x + t.z * t.z, m = Math.abs(a) * i;
	return {
		status: p <= m * m ? 1 : 2,
		tailPosition: d,
		hitNormal: f
	};
}
function or(e, t, n, r) {
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
function sr(e, t) {
	let n = t.clone().sub(e.origin), r = e.origin.clone().addScaledVector(e.upVector, n.dot(e.upVector)), i = t.clone().sub(r), a = i.length();
	return a <= I || e.radius <= I ? e.origin.clone() : e.origin.clone().addScaledVector(i, e.radius / a);
}
function cr(e, t, n, r, i = e.currTipPos) {
	let a = R(t, Ln), o = e.prevTipPos.clone(), s = i.clone().sub(o), c = a.clone().multiplyScalar(s.dot(a)), l = s.sub(c).multiplyScalar(1 - r).sub(c.multiplyScalar(n));
	if (l.lengthSq() <= 1e-4) {
		e.prevTipPos.copy(e.currTipPos);
		return;
	}
	e.prevTipPos.copy(e.currTipPos).sub(l);
	let u = e.currTipPos.distanceTo(o), d = l.length(), f = Math.max(d - u, 0);
	f > 0 && e.currTipPos.addScaledVector(l, f / d);
}
function lr(e) {
	if (!e.limit.active) return !1;
	let t = e.vector, n = e.basisUp.dot(t), r = e.basisUp.clone().multiplyScalar(n), i = t.clone().sub(r), a = i.length(), o = a <= I ? i.set(0, 0, 0) : i.multiplyScalar(1 / a), s = e.basisSide.dot(o), c = 180 / Math.PI * Math.asin(s < -1 ? -1 : Number.isNaN(s) ? 1 : Math.min(s, 1)), l = c - c * e.springStrength * e.deltaTime * e.deltaTime, u = l <= e.limit.max ? l : e.limit.max, d = l < e.limit.min ? e.limit.min : u, f = d >= 0 ? e.limit.max : e.limit.min, p = 0;
	if (f < -1e-4 || f > 1e-4) {
		let e = d / f;
		e >= 0 && (p = Math.min(e, 1));
	}
	let m = f * p, h = Math.PI / 180 * m, g = e.basisSide.clone().multiplyScalar(Math.sin(h)).addScaledVector(e.basisForward, Math.cos(h)).multiplyScalar(a);
	return t.copy(r).add(g), m !== l;
}
function ur(t, n, r, i, a) {
	let o = r.clone().multiply(i), s = R(a.clone().applyQuaternion(o), Ln), c = R(n.clone().sub(t), s);
	return new e.Quaternion().setFromUnitVectors(s, c).multiply(o).normalize();
}
function dr(t, n, r, i, a) {
	let o = r.clone().multiply(i), s = n.clone().sub(t).applyQuaternion(o.clone().invert());
	if (s.lengthSq() <= I * I) return i.clone();
	s.normalize();
	let c = new e.Quaternion().setFromUnitVectors(a.clone(), s);
	return i.clone().multiply(c);
}
function L(t) {
	return {
		status: 0,
		tailPosition: t.clone(),
		hitNormal: new e.Vector3(0, 0, 0)
	};
}
function fr(e) {
	return [...e].sort((e, t) => pr(e) - pr(t));
}
function pr(e) {
	return e.kind === "capsule" || e.kind === "capsuleLocal" ? 0 : e.kind === "sphere" ? 1 : 2;
}
function R(e, t) {
	return e.lengthSq() <= I * I && e.copy(t), e.lengthSq() <= I * I && e.copy(Ln), e.normalize();
}
function mr(e, t) {
	let n = t.elements, r = e.x, i = e.y, a = e.z;
	return e.set(n[0] * r + n[4] * i + n[8] * a, n[1] * r + n[5] * i + n[9] * a, n[2] * r + n[6] * i + n[10] * a), R(e, Ln);
}
function z(e, t) {
	return t === 0 ? e.x : t === 1 ? e.y : e.z;
}
function hr(e, t, n) {
	t === 0 ? e.x = n : t === 1 ? e.y = n : e.z = n;
}
//#endregion
//#region src/engine/unityCoordinateConversion.ts
var gr = {
	right: new e.Vector3(1, 0, 0),
	left: new e.Vector3(-1, 0, 0),
	up: new e.Vector3(0, 1, 0),
	down: new e.Vector3(0, -1, 0),
	forward: new e.Vector3(0, 0, 1),
	back: new e.Vector3(0, 0, -1)
};
function B(t, n) {
	if (!t) return n.clone();
	let r = Sr(t.x ?? t.X), i = Sr(t.y ?? t.Y), a = Sr(t.z ?? t.Z);
	return r === null || i === null || a === null ? n.clone() : new e.Vector3(r, i, a);
}
function _r(t) {
	if (!t) return new e.Quaternion();
	let n = Sr(t.x ?? t.X), r = Sr(t.y ?? t.Y), i = Sr(t.z ?? t.Z), a = Sr(t.w ?? t.W);
	return n === null || r === null || i === null || a === null ? new e.Quaternion() : new e.Quaternion(n, r, i, a).normalize();
}
function vr(t) {
	return new e.Vector3(-t.x, t.y, t.z);
}
function yr(e) {
	return vr(e);
}
function br(t) {
	return new e.Quaternion(t.x, -t.y, -t.z, t.w).normalize();
}
function xr(e) {
	return yr(gr[e]);
}
function Sr(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
//#endregion
//#region src/engine/unityPrefabSpringRuntimeAdapter.ts
var Cr = 1401298464324817e-60, wr = xr("right"), Tr = xr("left"), Er = xr("back"), Dr = xr("down"), Or = class t {
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
		let r = Ei(e);
		if (!r) return null;
		n.updateMatrixWorld(!0);
		let i = Xr(n), a = qr(r), o = ti(n), s = [], c = si(r), l = Lr(r, i, s, c), u = ri(r), d = ii(r), f = ai(r, l), p = ni(r), m = zr(r), h = Rr(r, c, m), g = /* @__PURE__ */ new Set(), _ = /* @__PURE__ */ new Map(), v = [], y = {
			setup: r,
			resolution: i,
			graphIndex: a,
			activeRoots: c,
			colliderByIndex: l,
			bindingByBonePathId: u,
			decisionByBonePathId: d,
			managerCacheByPathId: f,
			boneByPathId: p,
			springComponents: m,
			setupDiagnostics: h,
			missingNodes: s,
			controlledNodes: g,
			forceProviderCache: _
		};
		for (let e of r.managers ?? []) kr(e, y, v);
		return v.sort((e, t) => Qi(e.node) - Qi(t.node)), v.length > 0 ? new t(v, s, o, h) : null;
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
		for (let t of this.bones) t.stiffnessForce = Ui(e.stiffnessForce, t.originalStiffnessForce), t.dragForce = Ui(e.dragForce, t.originalDragForce), t.windInfluence = Ui(e.windInfluence, t.originalWindInfluence), t.slowMotionScale = Ui(e.slowMotionScale, 1), t.isPaused = e.paused ?? !1;
	}
	clearTimelineControl() {
		this.setTimelineControl({});
	}
	update(e) {
		this.bones.some((e) => e.automaticUpdates && e.enabled && !e.isPaused) && this.preUpdateColliders();
		let t = this.collectWindVolumeOneSelfProviders(), n = new Set(t.filter((e) => e.isActive && e.springManagerPathId !== null).map((e) => e.springManagerPathId)), r = new Set(t.filter((e) => !e.isActive && e.springManagerPathId !== null).map((e) => e.springManagerPathId));
		for (let t of this.bones) if (!(!t.automaticUpdates || !t.enabled)) {
			if (t.node.parent?.getWorldQuaternion(this.parentRotation), t.node.getWorldPosition(this.headPosition), t.isPaused) {
				this.applyBoneRotation(t, xi(t));
				continue;
			}
			!(t.managerPathId !== null && r.has(t.managerPathId) || t.isSumOfForcesOnBone) || t.managerPathId !== null && n.has(t.managerPathId) || (this.computeExternalForce(t, e), this.updateBoneSpringAndRotation(t, Ti(e, t.simulationFrameRate, t.slowMotionScale), this.externalForce, xi(t)));
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
		if (n <= Cr || e.period <= .001) return this.providerForce.set(0, 0, 0);
		e.node.updateMatrixWorld(!0), t.node.getWorldPosition(this.localBonePosition).applyMatrix4(this.providerWorldToLocal.copy(e.node.matrixWorld).invert());
		let r = -this.localBonePosition.x, i = Math.sin(e.timeFactor + Math.sin(r * e.positionalMultiplier) + Math.cos(this.localBonePosition.z * e.positionalMultiplier));
		return this.providerForce.set(0, 0, 1).transformDirection(e.node.matrixWorld).addScaledVector(e.offsetVector, i).normalize().multiplyScalar(n * t.windInfluence);
	}
	computeWindVolumeOneSelfForce(t, n, r) {
		let i = t.weight * t.strength;
		if (i <= Cr || t.period <= Cr) return this.providerForce.set(0, 0, 0);
		t.currentTime = Hi(t.currentTime, r, t.period);
		let a = t.currentTime * Math.PI * 2 / t.period;
		if (t.node.updateMatrixWorld(!0), this.waveAxis.set(0, 1, 0).transformDirection(t.node.matrixWorld), Math.abs(t.spinPeriod) > .001) {
			t.spinTime = Hi(t.spinTime, r, t.spinPeriod);
			let e = t.spinTime * Math.PI * 2 / t.spinPeriod;
			this.providerRight.copy(wr).transformDirection(t.node.matrixWorld), this.providerUp.set(0, 1, 0).transformDirection(t.node.matrixWorld), this.waveAxis.copy(this.providerRight).multiplyScalar(Math.cos(e)).addScaledVector(this.providerUp, Math.sin(e));
		}
		let o = Math.max(t.peakDistance, Cr);
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
		for (let e of this.bones) e.node.parent?.getWorldQuaternion(this.parentRotation), e.node.getWorldPosition(this.headPosition), e.skinAnimationLocalRotation.copy(e.node.quaternion), this.debugAnimatedTip.copy(zn({
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
			t.node.parent?.getWorldQuaternion(this.parentRotation), t.node.getWorldPosition(this.headPosition), this.debugAnimatedTip.copy(zn({
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
				tailBinding: Ni(t.tailBinding),
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
				dynamicRatio: xi(t),
				isAnimated: t.isAnimated,
				automaticUpdates: t.automaticUpdates,
				boneEnabled: t.enabled,
				bonePaused: t.isPaused,
				isSumOfForcesOnBone: t.isSumOfForcesOnBone,
				simulationFrameRate: t.simulationFrameRate,
				slowMotionScale: t.slowMotionScale,
				updateSkipReason: Oi(t),
				animatedTipDelta: H(d),
				velocity: H(f),
				springForce: H(t.springForce),
				colliderBindings: t.colliderBindingDiagnostics.map(gi)
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
				tailBinding: Ni(t.tailBinding),
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
				dynamicRatio: xi(t),
				isAnimated: t.isAnimated,
				automaticUpdates: t.automaticUpdates,
				boneEnabled: t.enabled,
				bonePaused: t.isPaused,
				isSumOfForcesOnBone: t.isSumOfForcesOnBone,
				simulationFrameRate: t.simulationFrameRate,
				slowMotionScale: t.slowMotionScale,
				updateSkipReason: Oi(t),
				animatedTipDelta: H(d),
				velocity: H(f),
				headMovement: H(t.state.cachedMovement),
				gravity: H(t.gravity),
				springForce: H(t.springForce),
				colliderBindings: t.colliderBindingDiagnostics.map(gi)
			});
		}
		i.sort((e, t) => t.offset - e.offset), a.sort((e, t) => t.offset - e.offset);
		let u = Di(i, n), d = jr(this.bones, this.skinnedBones);
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
			bindingDiagnostics: this.bones.flatMap((e) => e.colliderBindingDiagnostics).map(gi),
			skinnedBoneMatches: c,
			skinnedBoneMisses: l
		};
	}
	updateBoneSpringAndRotation(e, t, n, r) {
		e.node.parent?.getWorldQuaternion(this.parentRotation), e.node.getWorldPosition(this.headPosition);
		let i = this.shouldTraceBone(e) ? this.createTraceEvent(e, t, n, r) : null;
		this.advanceBoneSpring(e, t, n, i), this.applyLengthLimits(e, t), i && (i.stateAfterLengthLimits = U(e.state));
		let a = Math.abs(e.radius) * Yi(e.node);
		i && (i.tailRadius = a);
		let o = this.checkBoneGround(e, a, i);
		this.checkBoneCollisions(e, a, o, i), this.applyBoneAngleLimitsWithTrace(e, t, i), this.resetInvalidTipPosition(e), this.applyBoneRotation(e, r), i && (i.finalLocalRotation = Ai(e.node.quaternion), this.pushTraceEvent(i));
	}
	advanceBoneSpring(t, n, r, i) {
		this.captureSkinAnimationLocalRotation(t), i && (i.skinAnimationLocalRotation = Ai(t.skinAnimationLocalRotation)), Vn(t.state, this.headPosition), i && (i.stateAfterCache = U(t.state)), Bn(t.state, {
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
		}), i && (i.stateAfterUpdateSpring = U(t.state));
	}
	checkBoneGround(t, n, r) {
		let i = t.collideWithGround ? qn(t.state, {
			headPosition: this.headPosition,
			springLength: t.springLength,
			tailRadius: n,
			groundHeight: t.groundHeight,
			lengthFallbackDirection: t.boneAxis.clone().applyQuaternion(t.node.getWorldQuaternion(new e.Quaternion())),
			bounce: t.bounce,
			friction: t.friction
		}) : !1;
		return r && (r.groundHit = i, r.stateAfterGround = U(t.state)), i;
	}
	checkBoneCollisions(e, t, n, r) {
		e.lastCollisionInfo = null;
		let i = [], a = e.enableCollision ? this.buildWorldColliders(e.colliders) : [];
		e.lastCollisionStatus = !n && e.enableCollision ? Gn(e.state, {
			headPosition: this.headPosition,
			springLength: e.springLength,
			tailRadius: t,
			colliders: a,
			bounce: e.bounce,
			friction: e.friction,
			onColliderCheck: r ? (e, t) => i.push(Mi(e, t)) : void 0,
			onCollision: (t, n) => {
				e.lastCollisionInfo = {
					kind: t.kind,
					name: t.debugName ?? null,
					path: t.debugPath ?? null,
					sourcePathId: t.debugSourcePathId ?? null,
					hitNormal: n.hitNormal.clone()
				};
			}
		}) : 0, r && (r.collisionChecks = i, r.collisionStatus = e.lastCollisionStatus, r.stateAfterCollisions = U(e.state));
	}
	applyBoneAngleLimitsWithTrace(e, t, n) {
		let r = n ? ji(e) : void 0;
		e.lastAngleLimitApplied = e.enableAngleLimits ? this.applyAngleLimits(e, t, r) : !1, n && r && (n.angleLimit = r, n.stateAfterAngleLimits = U(e.state));
	}
	applyLengthLimits(t, n) {
		if (!t.enableLengthLimits || t.lengthLimitTargets.length === 0) return;
		let r = t.lengthLimitTargets.map((t) => ({
			position: t.node.getWorldPosition(new e.Vector3()),
			initialLength: t.initialLength
		}));
		Wn({
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
		let i = Tr.clone().transformDirection(r.matrixWorld), a = Er.clone().transformDirection(r.matrixWorld), o = Dr.clone().transformDirection(r.matrixWorld);
		n && (n.enabled = !0, n.hasPivot = !0, n.pivotName = r.name || null, n.pivotPath = q(r) || null, n.vectorBefore = H(this.angleVector), n.forward = H(i), n.back = H(a), n.down = H(o));
		let s = !1;
		if (e.yAngleLimit) {
			let r = lr({
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
			let r = lr({
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
		this.resetInvalidTipPosition(e), this.localRotation.copy(dr(this.headPosition, e.state.currTipPos, this.parentRotation, e.initialLocalRotation, e.boneAxis)), e.node.quaternion.copy($i(e.skinAnimationLocalRotation, this.localRotation, t)), e.lastAppliedLocalRotation.copy(e.node.quaternion), e.hasAppliedLocalRotation = !0, e.node.updateMatrix(), e.node.updateMatrixWorld(!0);
	}
	captureSkinAnimationLocalRotation(e) {
		this.skinAnimationLocalRotation.copy(e.node.quaternion), !(e.hasAppliedLocalRotation && ea(this.skinAnimationLocalRotation, e.lastAppliedLocalRotation)) && e.skinAnimationLocalRotation.copy(this.skinAnimationLocalRotation);
	}
	resetInvalidTipPosition(e) {
		Number.isFinite(e.state.currTipPos.x) && Number.isFinite(e.state.currTipPos.y) && Number.isFinite(e.state.currTipPos.z) || (this.debugAnimatedTip.copy(zn({
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
			tailBinding: Ni(e.tailBinding),
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
			parentRotation: Ai(this.parentRotation),
			initialLocalRotation: Ai(e.initialLocalRotation),
			skinAnimationLocalRotation: Ai(e.skinAnimationLocalRotation),
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
			animatedTip: H(zn({
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
			angleLimit: ji(e),
			stateAfterAngleLimits: U(e.state),
			finalLocalRotation: Ai(e.node.quaternion)
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
		let t = [...e].sort((e, t) => qi(e.source) - qi(t.source));
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
			localOffset: Fi(t.sphere.offset),
			radius: Math.max(0, t.sphere.radius ?? .01),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Xi(this.colliderWorldToLocal),
			localToWorldNormalMatrix: Zi(this.colliderLocalToWorld),
			lossyScaleX: Ji(e.node)
		}) : t?.capsule ? (e.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(e.node.matrixWorld), this.colliderWorldToLocal.copy(e.node.matrixWorld).invert(), {
			kind: "capsuleLocal",
			enabled: r,
			debugName: e.source.nodeName ?? e.source.scriptName ?? e.node.name,
			debugPath: e.source.nodePath ?? q(e.node),
			debugSourcePathId: e.source.pathId,
			localStart: Fi(t.capsule.offset),
			localEnd: Fi(t.capsule.tail),
			radius: Math.max(0, t.capsule.radius ?? .01),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Xi(this.colliderWorldToLocal),
			localToWorldNormalMatrix: Zi(this.colliderLocalToWorld),
			lossyScaleX: Ji(e.node)
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
			worldToLocalRadiusScale: Xi(this.colliderWorldToLocal),
			worldToLocalLengthScale: Xi(this.colliderWorldToLocal),
			localToWorldNormalMatrix: Zi(this.colliderLocalToWorld)
		}) : null;
	}
};
function kr(e, t, n) {
	if (!ci(e.nodePath ?? e.poseRoot, t.activeRoots)) return;
	let r = Nr(t.resolution, e, t.forceProviderCache);
	for (let i of e.bonePathIds ?? []) {
		let a = Ar(e, i, r, t);
		a && (n.push(a), t.controlledNodes.add(a.node));
	}
}
function Ar(e, t, n, r) {
	let { resolution: i } = r, a = r.boneByPathId.get(t);
	if (!a || !ci(a.nodePath, r.activeRoots)) return null;
	if (!Vr(a, r.springComponents)) return r.setupDiagnostics.rejectedUnverifiedBoneSourceCount += 1, null;
	let o = Qr(i, a.nodePath, a.runtimePartIndex);
	if (!o) return r.missingNodes.push(a.nodePath ?? a.nodeName ?? `bone:${t}`), null;
	if (r.controlledNodes.has(o)) return null;
	let s = Hr(r.setup, e, a, r.bindingByBonePathId.get(t), r.decisionByBonePathId.get(t), e.pathId === void 0 ? void 0 : r.managerCacheByPathId.get(e.pathId), r.colliderByIndex);
	return Mr(e, a, o, Ur(a, o, r.graphIndex, r.resolution), Qr(i, a.pivotNodePath, a.runtimePartIndex), li(r.resolution, a), n, s);
}
function jr(e, t) {
	let n = /* @__PURE__ */ new Map(), r = [];
	for (let i of e) {
		let e = Pi(i.sourceBonePath), a = `${i.runtimePartIndex ?? "null"}|${i.runtimePartType ?? "null"}|${e ?? "null"}`, o = n.get(a);
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
function Mr(t, n, r, i, a, o, s, c) {
	let l = i.tailPosition, u = r.getWorldPosition(new e.Vector3()), d = l.clone().sub(u).length(), f = r.quaternion.clone(), p = Ii(r, l), m = e.MathUtils.clamp(K(t.dynamicRatio) ?? .5, 0, 1), h = o.map((t) => ({
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
		gravity: Fi(t.rawGravity),
		forceProviders: s,
		node: r,
		state: Rn(u, l),
		initialLocalRotation: f,
		initialLocalScale: r.scale.clone(),
		skinAnimationLocalRotation: f.clone(),
		lastAppliedLocalRotation: f.clone(),
		hasAppliedLocalRotation: !1,
		boneAxis: p.axis,
		boneAxisSource: p.source,
		springLength: d,
		dynamicRatio: m,
		isAnimated: Si(n, r, t),
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
		springForce: Fi(n.rawSpringForce),
		springConstant: n.rawSpringConstant ?? .5,
		lengthLimitTargets: h,
		angularStiffness: Math.max(0, n.rawAngularStiffness ?? 100),
		pivotNode: a,
		yAngleLimit: bi(n.rawAngleLimits?.y),
		zAngleLimit: bi(n.rawAngleLimits?.z),
		colliders: c.colliders,
		colliderBindingDiagnostics: c.diagnostics,
		lastCollisionStatus: 0,
		lastCollisionInfo: null,
		lastAngleLimitApplied: !1
	};
}
function Nr(e, t, n) {
	return (t.forceProviders ?? []).map((t) => {
		let r = Pr(t), i = r ? n.get(r) : void 0;
		if (i) return i;
		let a = Fr(e, t);
		return a && r && n.set(r, a), a;
	}).filter((e) => !!e);
}
function Pr(e) {
	let t = typeof e.runtimePartIndex == "number" ? `${e.runtimePartIndex}:` : "";
	return typeof e.sourcePathId == "number" ? `${t}path:${e.sourcePathId}` : e.nodePath ? `${t}nodePath:${e.nodePath}` : null;
}
function Fr(t, n) {
	let r = n.scriptName ?? "", i = r.endsWith("WindVolumeOneSelf"), a = r.endsWith("WindVolume") && !i, o = r.endsWith("ForceVolume") && !a;
	if (!o && !a && !i) return null;
	let s = Qr(t, n.nodePath, n.runtimePartIndex) ?? Ir(t, n.nodeName), c = n.raw ?? {};
	if (!s || !zi(c, "m_Enabled", !0) || n.activeSelf === !1 || n.activeInHierarchy === !1) return null;
	let l = {
		sourcePathId: K(n.sourcePathId),
		node: s,
		springManagerPathId: K(n.springManagerPathId) ?? Bi(c, "<SpringManager>k__BackingField") ?? Bi(c, "_SpringManager_k__BackingField") ?? Bi(c, "springManager")
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
		offsetVector: Ri(c, "offsetVector")
	} : {
		kind: "WindVolumeOneSelf",
		...l,
		isActive: zi(c, "isActive", !1),
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
function Ir(e, t) {
	if (!t) return null;
	let n = [...new Set(e.nodeByPath.values())].filter((e) => e.name === t);
	return n.length === 1 ? n[0] : null;
}
function Lr(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let a of e.colliders ?? []) {
		if (typeof a.index != "number" || !ci(a.nodePath, r)) continue;
		let e = Qr(t, a.nodePath, a.runtimePartIndex);
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
function Rr(e, t, n) {
	return {
		managerCount: e.managers?.length ?? 0,
		boneSourceCount: e.bones?.length ?? 0,
		colliderSourceCount: e.colliders?.length ?? 0,
		bindingDecisionCount: e.bindingDecisions?.length ?? 0,
		managerColliderCacheCount: e.managerColliderCaches?.length ?? 0,
		officialSpringComponentCount: n.pathIds.size,
		rejectedUnverifiedBoneSourceCount: 0,
		activeRootCount: t.size,
		activeRoots: [...t].sort((e, t) => e.localeCompare(t))
	};
}
function zr(e) {
	let t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), r = !1;
	for (let i of e.prefabGraphs ?? []) {
		Array.isArray(i.monoBehaviours) && (r = !0);
		for (let e of i.monoBehaviours ?? []) Br(e.scriptName) && (typeof e.pathId == "number" && t.add(e.pathId), e.transformPath && n.add(V(e.runtimePartIndex ?? -1, e.transformPath)));
	}
	return {
		hasComponentMetadata: r,
		pathIds: t,
		partPaths: n
	};
}
function Br(e) {
	let t = e?.trim().toLowerCase();
	return t === "springbone" || t === "sekaispringbone";
}
function Vr(e, t) {
	return !t.hasComponentMetadata || typeof e.pathId == "number" && t.pathIds.has(e.pathId) ? !0 : !!(e.nodePath && t.partPaths.has(V(e.runtimePartIndex ?? -1, e.nodePath)));
}
function Hr(e, t, n, r, i, a, o) {
	if (!r && !i) return {
		colliders: [],
		diagnostics: a ? [hi(t, n, r, i, null, null, null, `no per-bone collider binding; manager cache not used as fallback; ${yi(a)}`, [])] : []
	};
	let s = i?.sourceKind ?? r?.sourceKind ?? "direct", c = ui(i?.candidateRoots ?? r?.collidersByRoot, o);
	if (s === "colliderFlag" && c.size > 0) {
		let o = fi(c, a), s = pi(e, t, n, i, r, o), l = s.root ? o.get(s.root) ?? [] : [];
		return {
			colliders: l,
			diagnostics: [hi(t, n, r, i, c, i?.defaultRoot ?? r?.defaultRoot, s.root, `${s.reason}; manager cache constrained; ${yi(a)}`, l)]
		};
	}
	let l = _i((i?.selectedColliderIndexes ?? r?.colliders ?? []).map((e) => o.get(e)).filter((e) => !!e), t, n);
	return {
		colliders: l,
		diagnostics: [hi(t, n, r, i, null, i?.defaultRoot ?? r?.defaultRoot, null, `${i?.selectedColliderIndexes ? "bindingDecision.selectedColliderIndexes" : r?.colliders ? "colliderBinding.colliders" : "no direct collider indexes"} / direct serialized collider references / pose root preference; ${yi(a)}`, l)]
	};
}
function Ur(t, n, r, i) {
	n.updateMatrixWorld(!0);
	let a = n.getWorldPosition(new e.Vector3()), o = xr("right").transformDirection(n.matrixWorld), s = a.clone().addScaledVector(o, -.1), c = t.nodePath ? $r(r, t.nodePath, t.runtimePartIndex) : void 0, l = c ? Gr(c, r, i, t.runtimePartIndex) : [], u = l.map((e) => e.source.name ?? e.node.name), d = l.map((e) => e.source.transformPath ?? q(e.node));
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
	let m = Wr(a, f, p);
	return {
		mode: "averageChildren",
		childCount: l.length,
		childNames: u,
		childPaths: d,
		childSources: l.map((e) => e.source),
		tailPosition: m
	};
}
function Wr(e, t, n) {
	let r = t.clone().sub(e);
	return r.lengthSq() <= 1e-5 * 1e-5 ? r.copy(wr) : r.normalize(), e.clone().addScaledVector(r, n);
}
function Gr(e, t, n, r) {
	let i = [];
	for (let a of e.childPathIds ?? []) {
		let e = t.transformByPathId.get(a);
		if (!e || !Kr(e, t)) continue;
		let o = Qr(n, e.transformPath, r ?? e.runtimePartIndex);
		o && i.push({
			source: e,
			node: o
		});
	}
	return i;
}
function Kr(e, t) {
	return typeof e.pathId == "number" && t.pivotTransformPathIds.has(e.pathId) ? !1 : !e.transformPath || !t.pivotTransformPaths.has(e.transformPath);
}
function qr(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
	return Jr(e, t, n, r), Yr(e, n, i, a), {
		transformByPathId: t,
		transformByPath: n,
		transformByPartPath: r,
		pivotTransformPathIds: i,
		pivotTransformPaths: a
	};
}
function Jr(e, t, n, r) {
	for (let i of e.prefabGraphs ?? []) for (let e of i.transforms ?? []) typeof e.pathId == "number" && t.set(e.pathId, e), e.transformPath && (n.set(e.transformPath, e), typeof e.runtimePartIndex == "number" && r.set(V(e.runtimePartIndex, e.transformPath), e));
}
function Yr(e, t, n, r) {
	for (let i of e.prefabGraphs ?? []) for (let e of i.monoBehaviours ?? []) {
		if (e.scriptName?.toLowerCase() !== "springbonepivot" || !e.transformPath) continue;
		r.add(e.transformPath);
		let i = t.get(e.transformPath);
		typeof i?.pathId == "number" && n.add(i.pathId);
	}
}
function Xr(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
	return e.traverse((i) => {
		let a = q(i, e);
		if (!a) return;
		t.set(a, i);
		let o = Gi(i, e);
		o && o !== a && r.set(o, i);
		let s = ei(i), c = i.userData.pjskTransformPath;
		for (let e of typeof c == "string" && c.length > 0 ? [c] : []) typeof s == "number" && n.set(V(s, e), i), t.has(e) || t.set(e, i);
	}), {
		nodeByPath: t,
		nodeByPartPath: n,
		canonicalNodeByPath: r
	};
}
function Zr(e, t) {
	return t ? e.nodeByPath.get(t) ?? e.canonicalNodeByPath.get(t) ?? null : null;
}
function Qr(e, t, n) {
	if (!t) return null;
	if (typeof n == "number") {
		let r = e.nodeByPartPath.get(V(n, t));
		if (r) return r;
	}
	return Zr(e, t);
}
function $r(e, t, n) {
	return typeof n == "number" ? e.transformByPartPath.get(V(n, t)) ?? e.transformByPath.get(t) : e.transformByPath.get(t);
}
function V(e, t) {
	return `${e}:${t}`;
}
function ei(e) {
	let t = e.userData.pjskRuntimePartIndex;
	return typeof t == "number" ? t : void 0;
}
function ti(e) {
	let t = /* @__PURE__ */ new Set();
	return e.traverse((e) => {
		let n = e;
		if (n.isSkinnedMesh) for (let e of n.skeleton.bones) t.add(e);
	}), t;
}
function ni(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.bones ?? []) typeof n.pathId == "number" && t.set(n.pathId, n);
	return t;
}
function ri(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.colliderBindings ?? []) typeof n.sourceSpringBonePathId == "number" && t.set(n.sourceSpringBonePathId, n);
	return t;
}
function ii(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.bindingDecisions ?? []) typeof n.sourceSpringBonePathId == "number" && t.set(n.sourceSpringBonePathId, n);
	return t;
}
function ai(e, t) {
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
			typeof n == "number" && i && oi(r, i) && e.add(n);
		}
		n.set(r.managerPathId, {
			source: r,
			colliderIndexes: e
		});
	}
	return n;
}
function oi(e, t) {
	let n = e.managerNodePath ?? "", r = t.source.nodePath ?? "", i = t.source.shape;
	return n.endsWith("/Position/PositionOffset/Hip") ? i?.sphere ? /\/(?:Left_Thigh|Right_Thigh)\/CL_/.test(r) || /\/Hip\/CL_HipSphereCollider$/.test(r) : !1 : !0;
}
function si(e) {
	return new Set((e.activeRootProfile?.activeRoots ?? []).map((e) => W(e)).filter((e) => !!e));
}
function ci(e, t) {
	if (t.size === 0) return !0;
	let n = W(Pi(e));
	return n !== null && t.has(n);
}
function li(e, t) {
	let n = [];
	for (let r of t.lengthLimitTargets ?? []) {
		let i = Qr(e, r.nodePath, r.runtimePartIndex ?? t.runtimePartIndex);
		i && n.push({
			node: i,
			initialLength: 0
		});
	}
	return n;
}
function ui(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let [r, i] of Object.entries(e ?? {})) {
		let e = i.map((e) => t.get(e)).filter((e) => !!e);
		e.length > 0 && n.set(r, e);
	}
	return n;
}
function di(e, t) {
	return !t || t.colliderIndexes.size === 0 ? e : e.filter((e) => typeof e.source.index == "number" && t.colliderIndexes.has(e.source.index));
}
function fi(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let [r, i] of e.entries()) {
		let e = di(i, t);
		e.length > 0 && n.set(r, e);
	}
	return n;
}
function pi(e, t, n, r, i, a) {
	if (a.size === 1) return {
		root: a.keys().next().value,
		reason: "single manager-cache root"
	};
	let o = W(Pi(n.nodePath));
	if (o && a.has(o)) return {
		root: o,
		reason: "joint root matched candidate root"
	};
	let s = mi(e, t, o, a);
	if (s) return s;
	let c = W(r?.defaultRoot);
	if (c && a.has(c)) return {
		root: c,
		reason: "bindingDecision.defaultRoot"
	};
	for (let t of e.activeRootProfile?.activeRoots ?? []) {
		let e = W(t);
		if (e && a.has(e)) return {
			root: e,
			reason: "activeRootProfile active root"
		};
	}
	let l = W(i?.defaultRoot);
	return l && a.has(l) ? {
		root: l,
		reason: "binding.defaultRoot"
	} : {
		root: null,
		reason: l ? `binding.defaultRoot ${l} not available after manager cache` : "no matching root"
	};
}
function mi(e, t, n, r) {
	if (t.partKind !== "Head" && n !== "face") return null;
	let i = W(e.rootSelectionProfile?.defaultBodyRoot ?? e.activeRootProfile?.defaultBodyRoot);
	return i && r.has(i) ? {
		root: i,
		reason: "head/face uses runtime defaultBodyRoot"
	} : r.has("body") ? {
		root: "body",
		reason: "head/face body fallback"
	} : null;
}
function hi(e, t, n, r, i, a, o, s, c) {
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
function gi(e) {
	return {
		...e,
		candidateRoots: e.candidateRoots.map((e) => ({
			...e,
			colliderSourcePathIds: [...e.colliderSourcePathIds]
		})),
		selectedColliderSourcePathIds: [...e.selectedColliderSourcePathIds]
	};
}
function _i(e, t, n) {
	let r = vi(t, n);
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
function vi(e, t) {
	return t.nodePath?.startsWith("sit_body/") ? "sit_body/" : t.nodePath?.startsWith("body/") || e.partKind === "Head" || t.nodePath?.startsWith("face/") ? "body/" : null;
}
function yi(e) {
	return e ? `${e.source.managerNodeName ?? "manager"} manager cache (${e.source.sphereColliderIndexes?.length ?? 0} sphere, ${e.source.capsuleColliderIndexes?.length ?? 0} capsule, ${e.source.panelColliderIndexes?.length ?? 0} panel)` : "no manager cache available";
}
function bi(e) {
	return e?.active ? {
		active: !0,
		min: e.min ?? 0,
		max: e.max ?? 0
	} : null;
}
function xi(e) {
	return e.isAnimated ? e.dynamicRatio : 1;
}
function Si(e, t, n) {
	let r = wi(n.animatedBoneNames);
	return r.size === 0 ? !1 : Ci(t.name, r) || typeof e.nodeName == "string" && Ci(e.nodeName, r);
}
function Ci(e, t) {
	if (t.has(e)) return !0;
	for (let n of t) if (n.length > 0 && e.includes(n)) return !0;
	return !1;
}
function wi(e) {
	return Array.isArray(e) ? new Set(e.filter((e) => typeof e == "string")) : /* @__PURE__ */ new Set();
}
function Ti(e, t, n) {
	let r = t > 0 ? 1 / t : e;
	return n === 1 ? r : r * n;
}
function Ei(e) {
	let t = Wi(e), n = Wi(t?.pjskSpringBone ?? t?.PjskSpringBone), r = Wi(n?.runtimeUnitySetup ?? n?.RuntimeUnitySetup), i = r?.version;
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
function Di(e, t) {
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
function Oi(e) {
	return e.automaticUpdates ? e.enabled ? e.isPaused ? "isPaused=true" : e.isSumOfForcesOnBone ? null : "isSumOfForcesOnBone=false" : "enabled=false" : "automaticUpdates=false";
}
function ki(e) {
	return e ? H(e) : null;
}
function Ai(e) {
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
function ji(e) {
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
function Mi(e, t) {
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
		localHeadPosition: ki(t.details.localHeadPosition),
		localTailPositionBefore: ki(t.details.localTailPositionBefore),
		localTailPositionAfter: ki(t.details.localTailPositionAfter),
		localTailRadius: t.details.localTailRadius ?? null,
		localSphereOrigin: ki(t.details.localSphereOrigin),
		localSphereRadius: t.details.localSphereRadius ?? null,
		localCapsuleStart: ki(t.details.localCapsuleStart),
		localCapsuleEnd: ki(t.details.localCapsuleEnd),
		capsuleRadius: t.details.capsuleRadius ?? null,
		panelWidth: t.details.panelWidth ?? null,
		panelHeight: t.details.panelHeight ?? null
	};
}
function Ni(e) {
	return {
		mode: e.mode,
		childCount: e.childCount,
		childNames: [...e.childNames],
		childPaths: [...e.childPaths],
		tailPosition: H(e.tailPosition)
	};
}
function Pi(e) {
	if (!e) return null;
	let t = e.indexOf("/");
	return t < 0 ? e : e.slice(0, t);
}
function W(e) {
	return e ? e.endsWith("/") ? e.slice(0, -1) : e : null;
}
function Fi(t) {
	return yr(Array.isArray(t) ? new e.Vector3(t[0] ?? 0, t[1] ?? 0, t[2] ?? 0) : B(t, new e.Vector3()));
}
function Ii(e, t) {
	e.updateMatrixWorld(!0);
	let n = Li(e.worldToLocal(t.clone()));
	return n ? {
		axis: n,
		source: "computed-local-tip"
	} : {
		axis: wr.clone(),
		source: "fallback-local-tip"
	};
}
function Li(e) {
	return e.lengthSq() <= 1e-5 * 1e-5 ? null : e.clone().normalize();
}
function G(e, t, n) {
	return K(e[t] ?? e[Vi(t)]) ?? n;
}
function Ri(t, n) {
	let r = t[n] ?? t[Vi(n)];
	return Array.isArray(r) || typeof r == "object" && r ? Fi(r) : new e.Vector3();
}
function zi(e, t, n) {
	let r = e[t] ?? e[Vi(t)];
	return typeof r == "boolean" ? r : typeof r == "number" ? r !== 0 : n;
}
function Bi(e, t) {
	let n = Wi(e[t] ?? e[Vi(t)]);
	return K(n?.m_PathID ?? n?.m_pathID ?? n?.pathId);
}
function Vi(e) {
	return e.length > 0 ? e[0].toUpperCase() + e.slice(1) : e;
}
function Hi(t, n, r) {
	return r > 0 ? e.MathUtils.euclideanModulo(t + n, r) : t + n;
}
function Ui(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function K(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function Wi(e) {
	return e && typeof e == "object" ? e : null;
}
function q(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(r.name), r = r.parent;
	return n.join("/");
}
function Gi(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(Ki(r.name)), r = r.parent;
	return n.join("/");
}
function Ki(e) {
	return e.replace(/_([1-9]\d*)$/, "");
}
function qi(e) {
	return e.shape?.sphere ? 0 : e.shape?.capsule ? 1 : 2;
}
function Ji(t) {
	return t.getWorldScale(new e.Vector3()).x;
}
function Yi(e) {
	let t = e.matrixWorld.elements;
	return Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]);
}
function Xi(e) {
	let t = e.elements;
	return Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]);
}
function Zi(e) {
	let t = e.clone();
	return t.setPosition(0, 0, 0), t.invert().transpose();
}
function Qi(e) {
	let t = 0, n = e;
	for (; n;) t += 1, n = n.parent;
	return t;
}
function $i(t, n, r) {
	let i = e.MathUtils.clamp(r, 0, 1), a = n.x, o = n.y, s = n.z, c = n.w;
	return t.dot(n) < 0 && (a = -a, o = -o, s = -s, c = -c), new e.Quaternion(t.x + (a - t.x) * i, t.y + (o - t.y) * i, t.z + (s - t.z) * i, t.w + (c - t.w) * i).normalize();
}
function ea(e, t) {
	return Math.abs(e.x - t.x) < 1e-6 && Math.abs(e.y - t.y) < 1e-6 && Math.abs(e.z - t.z) < 1e-6 && Math.abs(e.w - t.w) < 1e-6;
}
var ta = {
	buildRuntimeSpringComponentIndex: zr,
	isOfficialRuntimeSpringComponent: Br,
	isVerifiedRuntimeSpringBone: Vr,
	resolveColliderBinding: Hr,
	computeUnityPrefabChildPosition: Ur,
	collectUnityPrefabTailChildren: Gr,
	isValidPrefabSpringTailChild: Kr,
	buildPrefabGraphIndex: qr,
	buildNodeResolution: Xr,
	resolveNode: Zr,
	resolveNodeForPart: Qr,
	resolvePrefabTransformForPart: $r,
	partPathKey: V,
	readRuntimePartIndex: ei,
	collectSkinnedBones: ti,
	buildBoneMap: ni,
	buildColliderBindingMap: ri,
	buildBindingDecisionMap: ii,
	buildManagerColliderCacheMap: ai,
	isRuntimeManagerCacheCollider: oi,
	buildActiveRootSet: si,
	isRuntimePathActive: ci,
	resolveLengthLimitTargets: li,
	buildCandidateRootMap: ui,
	filterCollidersByManagerCache: di,
	constrainColliderRootsByManagerCache: fi,
	selectUnityColliderRoot: pi,
	selectHeadColliderRoot: mi,
	buildColliderBindingDiagnostic: hi,
	cloneColliderBindingDiagnostic: gi,
	preferMatchingPoseColliders: _i,
	preferredColliderRoot: vi,
	managerCacheSummary: yi,
	angleLimitFromSource: bi,
	getEffectiveDynamicRatio: xi,
	isBoneAnimated: Si,
	containsAnimatedBoneName: Ci,
	readStringSet: wi,
	calcUtjManagerTimeStep: Ti,
	readRuntimeUnitySetup0414: Ei,
	selectDebugOffsets: Di,
	rootNameFromPath: Pi,
	normalizeRootName: W,
	vectorFromUnity: Fi,
	resolveRuntimeBoneAxis: Ii,
	normalizeRuntimeAxis: Li,
	readRawNumber: G,
	readUnityRawVector: Ri,
	readRawBoolean: zi,
	readRawObjectPathId: Bi,
	capitalize: Vi,
	addPeriodically: Hi,
	finiteOverride: Ui,
	readFiniteNumber: K,
	asRecord: Wi,
	getObjectPath: q,
	getCanonicalObjectPath: Gi,
	stripThreeUniqueNameSuffix: Ki,
	sourceColliderOrder: qi,
	worldScaleX: Ji,
	matrixWorldXScale: Yi,
	matrixXDirectionLength: Xi,
	makeNormalDirectionMatrix: Zi,
	getObjectDepth: Qi,
	lerpQuaternionNormalized: $i,
	quaternionsAlmostEqual: ea
};
//#endregion
//#region src/kernel/renderRecipe.ts
function na(e) {
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
function ra(e) {
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
var ia = new e.Vector3(), aa = new e.Quaternion(), oa = new e.Vector3(), J = new e.Vector3(), sa = new e.Quaternion(), ca = new e.Quaternion(), Y = new e.Vector3(), la = new e.Vector3(), ua = new e.Vector3(0, 1, 0), da = 7, fa = class {
	graph;
	setup;
	constraints;
	constructor(e, t, n) {
		this.graph = e, this.setup = t, e.root.updateMatrixWorld(!0);
		let r = Array.isArray(t.constraints) ? t.constraints : [];
		this.constraints = r.map((t) => ha(e, t, n));
	}
	update() {
		this.graph.root.updateMatrixWorld(!0);
		let e = this.constraints.map(ga);
		return this.graph.root.updateMatrixWorld(!0), ma(this.setup, e);
	}
};
function pa(e, t, n) {
	if (!t) return null;
	let r = Array.isArray(t.constraints) ? t.constraints : [];
	e.root.updateMatrixWorld(!0);
	let i = r.map((t) => ha(e, t, n)).map(ga);
	return e.root.updateMatrixWorld(!0), ma(t, i);
}
function ma(e, t) {
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
function ha(e, t, n) {
	let r = Ha(t.type) ?? "unknown", i = Ha(t.ownerPath), a = Ha(t.ownerName), o = xa(e, i, a), s = xa(e, Ha(t.worldUpObjectPath), Ha(t.worldUpObjectName)).node, c = (Array.isArray(t.sources) ? t.sources : []).map((t) => va(e, t, n));
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
function ga(t) {
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
	let f = c.filter(ba), p = o.node.position.clone(), m = o.node.quaternion.clone();
	if (r === "parent") return Sa(o.node, f) ? (Da(o.node, n, p, m, !0, !0), _a(r, i, a, l, "parent constraint applied with height-scaled translation offsets")) : u("skipped", "parent constraint has no positive source weight");
	if (r === "rotation") return Ca(o.node, f, n.rotationOffset) ? (Da(o.node, n, p, m, !1, !0), _a(r, i, a, l, "rotation constraint applied with weighted source rotations")) : u("skipped", "rotation constraint has no positive source weight");
	if (r === "aim") {
		let t = Ra(n.aimVector, new e.Vector3(0, 0, 1)), c = Ra(n.upVector, new e.Vector3(0, 1, 0)), d = Ta(o.node, s, n.worldUpType, n.worldUpVector);
		return wa(o.node, f, t, c, d, n.rotationOffset) ? (Da(o.node, n, p, m, !1, !0), _a(r, i, a, l, "aim constraint applied with exported aim/up vectors")) : u("skipped", "aim constraint target direction or source weight was invalid");
	}
	return u("skipped", `unsupported constraint type ${r}`);
}
function _a(e, t, n, r, i) {
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
function va(e, t, n) {
	let r = Ha(t.sourcePath), i = Ha(t.sourceName), a = ya(e, r, i), o = Ua(t.weight) ?? 1, s = Ia(t.translationOffset, n), c = La(t.rotationOffset);
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
function ya(e, t, n) {
	if (n) {
		let t = null;
		if (e.root.traverse((e) => {
			!t && e.name === n && (t = e);
		}), t) return {
			node: t,
			reason: "rebound by transform name in the combined model"
		};
	}
	return xa(e, t, n);
}
function ba(e) {
	return !!e.node;
}
function xa(e, t, n) {
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
function Sa(t, n) {
	let r = n.reduce((e, t) => e + Math.max(0, t.weight), 0);
	if (r <= 0) return !1;
	J.set(0, 0, 0);
	let i = null, a = 0;
	for (let t of n) {
		let n = Math.max(0, t.weight);
		if (n <= 0) continue;
		t.node.updateMatrixWorld(!0), t.node.matrixWorld.decompose(ia, aa, oa);
		let o = ia.clone().add((t.translationOffset ?? new e.Vector3()).clone().applyQuaternion(aa));
		J.addScaledVector(o, n / r), i = Pa(i, Ea(aa, t.rotationOffset), a, n), a += n;
	}
	return i ? (Na(t, J, i), !0) : !1;
}
function Ca(e, t, n) {
	let r = Fa(t);
	return r ? (e.getWorldPosition(J), Na(e, J, Ea(r, La(n))), !0) : !1;
}
function wa(t, n, r, i, a, o) {
	let s = n.reduce((e, t) => e + Math.max(0, t.weight), 0);
	if (s <= 0) return !1;
	t.updateMatrixWorld(!0), t.getWorldPosition(J), Y.set(0, 0, 0);
	for (let e of n) {
		let t = Math.max(0, e.weight);
		t <= 0 || (e.node.updateMatrixWorld(!0), e.node.getWorldPosition(ia), Y.addScaledVector(ia, t / s));
	}
	if (Y.sub(J), Y.lengthSq() < 1e-6) return !1;
	Y.normalize();
	let c = Ba(r, new e.Vector3(0, 0, 1)), l = Ba(i, new e.Vector3(0, 1, 0));
	if (sa.setFromUnitVectors(c, Y), la.copy(l).applyQuaternion(sa), a) {
		let t = Ba(a, ua), n = Va(la, Y), r = Va(t, Y);
		if (n.lengthSq() > 1e-6 && r.lengthSq() > 1e-6) {
			n.normalize(), r.normalize();
			let t = Math.atan2(Y.dot(new e.Vector3().crossVectors(n, r)), e.MathUtils.clamp(n.dot(r), -1, 1));
			sa.premultiply(new e.Quaternion().setFromAxisAngle(Y, t));
		}
	}
	return Na(t, J, Ea(sa, La(o))), !0;
}
function Ta(e, t, n, r) {
	switch (Ua(n) ?? 0) {
		case 1: return t ? (e.getWorldPosition(J), t.getWorldPosition(ia), ia.clone().sub(J)) : ua.clone();
		case 2: return t ? za(t, Ra(r, ua)) : Ra(r, ua);
		case 3: return Ra(r, ua);
		case 4: return null;
		default: return ua.clone();
	}
}
function Ea(e, t) {
	return t ? e.clone().multiply(Ma(t)).normalize() : e.clone();
}
function Da(t, n, r, i, a, o) {
	let s = e.MathUtils.clamp(Ua(n.weight) ?? 1, 0, 1), c = t.position.clone(), l = t.quaternion.clone(), u = Ia(n.translationAtRest, 1) ?? r, d = n.rotationAtRest ? Ma(ja(n.rotationAtRest)) : i;
	Oa(t, n, r, u, c, s, a), ka(t, n, i, d, l, s, o), t.updateMatrix(), t.updateMatrixWorld(!0);
}
function Oa(e, t, n, r, i, a, o) {
	if (!o) {
		e.position.copy(n);
		return;
	}
	let s = Ua(t.translationAxis) ?? da, c = r.clone().lerp(i, a);
	e.position.set(Aa(s, 1) ? c.x : r.x, Aa(s, 2) ? c.y : r.y, Aa(s, 4) ? c.z : r.z);
}
function ka(t, n, r, i, a, o, s) {
	if (!s) {
		t.quaternion.copy(r);
		return;
	}
	let c = Ua(n.rotationAxis) ?? da, l = new e.Euler().setFromQuaternion(i, "ZXY"), u = new e.Euler().setFromQuaternion(a, "ZXY"), d = new e.Euler(Aa(c, 1) ? u.x : l.x, Aa(c, 2) ? u.y : l.y, Aa(c, 4) ? u.z : l.z, "ZXY");
	t.quaternion.copy(i).slerp(new e.Quaternion().setFromEuler(d), o).normalize();
}
function Aa(e, t) {
	return (e & t) !== 0;
}
function ja(t) {
	return B(t, new e.Vector3());
}
function Ma(t) {
	return br(new e.Quaternion().setFromEuler(new e.Euler(e.MathUtils.degToRad(t.x), e.MathUtils.degToRad(t.y), e.MathUtils.degToRad(t.z), "ZXY")));
}
function Na(e, t, n) {
	let r = t.clone(), i = n.clone();
	e.parent && (e.parent.updateMatrixWorld(!0), e.parent.worldToLocal(r), e.parent.getWorldQuaternion(ca), i.premultiply(ca.invert())), e.position.copy(r), e.quaternion.copy(i.normalize()), e.updateMatrix(), e.updateMatrixWorld(!0);
}
function Pa(e, t, n, r) {
	if (!e) return t.clone();
	let i = t.clone();
	return e.dot(i) < 0 && i.set(-i.x, -i.y, -i.z, -i.w), e.slerp(i, r / (n + r)).normalize();
}
function Fa(e) {
	let t = null, n = 0;
	for (let r of e) {
		let e = Math.max(0, r.weight);
		e <= 0 || (r.node.updateMatrixWorld(!0), r.node.getWorldQuaternion(aa), t = Pa(t, aa, n, e), n += e);
	}
	return t;
}
function Ia(t, n) {
	return !t || typeof t != "object" ? null : vr(B(t, new e.Vector3())).multiplyScalar(n);
}
function La(t) {
	return !t || typeof t != "object" ? null : B(t, new e.Vector3());
}
function Ra(e, t) {
	return !e || typeof e != "object" ? t.clone() : yr(B(e, t));
}
function za(e, t) {
	return e.updateMatrixWorld(!0), e.getWorldQuaternion(sa), t.clone().applyQuaternion(sa);
}
function Ba(e, t) {
	return e.lengthSq() > 1e-6 ? e.clone().normalize() : t.clone().normalize();
}
function Va(e, t) {
	return e.clone().addScaledVector(t, -e.dot(t));
}
function Ha(e) {
	return typeof e == "string" ? e : null;
}
function Ua(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
//#endregion
//#region src/engine/unityPrefabRuntime.ts
function Wa(t, n) {
	let r = e.MathUtils.clamp(n || 1, .5, 2), i = t.nodeByPath.get("body/Position");
	if (!i) throw Error("Official CharacterModel PositionNote 'body/Position' was not found.");
	return i.scale.setScalar(r), i.updateMatrix(), t.root.updateMatrixWorld(!0), i;
}
function X(e) {
	return e && typeof e == "object" ? e : {};
}
function Ga(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function Z(e) {
	let t = X(e), n = X(t.pjskSpringBone ?? t.PjskSpringBone), r = X(t.runtimeUnitySetup ?? t.RuntimeUnitySetup ?? n.runtimeUnitySetup ?? n.RuntimeUnitySetup), i = r.version;
	return i === "0414" || i === 414 ? r : null;
}
function Ka(e) {
	let t = X(e), n = X(t.nativeMeshes ?? t.NativeMeshes), r = n.version;
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
function qa(e) {
	return e?.parentingMode === "model_combine_setup";
}
function Ja(e, t) {
	e.parent && e.parent.remove(e), t.add(e), e.updateMatrix();
}
function Ya(e, t) {
	for (; e.children.length > 0;) Ja(e.children[0], t);
}
function Xa(e, t, n) {
	let r = [], i = /* @__PURE__ */ new Set();
	for (let a of t) {
		let t = e.get(a);
		t && !i.has(t) && (Ja(t, n), i.add(t), r.push(a));
	}
	return r;
}
function Za(e, t, n) {
	e.parent && e.parent.remove(e);
	let r = /* @__PURE__ */ new Set();
	e.traverse((e) => {
		e.userData.pjskModelCombineDestroyed = !0, r.add(e);
	});
	for (let [e, n] of t.entries()) r.has(n) && t.delete(e);
	for (let [e, t] of n.entries()) r.has(t) && n.delete(e);
}
function Qa(e, t, n) {
	for (let [r, i] of e.entries()) i === t && e.set(r, n);
}
function $a(e, t, n, r, i) {
	let a = r.childMoveSuffix ?? "_target", o = r.parentRootPath, s = r.childRootPath, c = Q(t, [r.parentCombineNodeAPath ?? r.parentAttachPath]), l = Q(t, [r.parentCombineNodeBPath]), u = Q(t, [r.childCombineNodeAPath ?? r.childOriginPath]), d = Q(t, [r.childCombineNodeBPath]), f = Q(t, [s]);
	if (!o || !s || !c || !l || !u || !d || !f) throw Error("Official model_combine_setup paths were not fully resolved.");
	Ya(l.node, d.node);
	let p = c.node.parent, m = u.node.parent;
	if (p && m) {
		for (let e of [...p.children]) e.name.endsWith(a) && Ja(e, m);
		let e = Xa(t, i, t.get(o) ?? p), n = i.filter((t) => !e.includes(t));
		if (n.length > 0) throw Error(`Official model_combine_setup head renderers were not moved: ${n.join(", ")}.`);
		let c = `${s}/${r.faceRendererName ?? "Face"}`;
		if (!e.includes(c)) throw Error(`Official model_combine_setup face renderer '${c}' was not moved.`);
		Ja(u.node, p);
	}
	return u.node.position.copy(c.node.position), u.node.quaternion.copy(c.node.quaternion), u.node.scale.copy(c.node.scale), u.node.updateMatrix(), d.node.position.copy(l.node.position), d.node.quaternion.copy(l.node.quaternion), d.node.scale.copy(l.node.scale), d.node.updateMatrix(), Qa(n, c.node, u.node), Qa(n, l.node, d.node), Za(l.node, t, n), Za(c.node, t, n), Za(f.node, t, n), t.set(c.path, u.node), t.set(l.path, d.node), r.parentAttachPath && t.set(r.parentAttachPath, u.node), r.parentCombineNodeBPath && t.set(r.parentCombineNodeBPath, d.node), e.updateMatrixWorld(!0), {
		bodyNodeA: c,
		bodyNodeB: l,
		faceNodeA: u,
		faceNodeB: d
	};
}
function eo(e, t) {
	return [...new Set((Z(e)?.prefabGraphs ?? []).flatMap((e) => e.renderers ?? []).filter((e) => e.typeName === "SkinnedMeshRenderer").map((e) => e.transformPath).filter((e) => !!(e && e.startsWith(`${t}/`))))];
}
function to(e, t) {
	let n = Z(e), r = n?.bodyHeadAssembly?.childRootPath, i = t.rendererTransformPath;
	if (!r || !i?.startsWith(`${r}/`)) return !1;
	let a = (n.prefabGraphs ?? []).flatMap((e) => e.renderers ?? []).filter((e) => e.transformPath === i);
	return a.length > 0 && a.every((e) => e.typeName !== "SkinnedMeshRenderer");
}
function no(e, t) {
	return (Ka(e)?.meshes ?? []).find((e) => e.rendererTransformPath?.startsWith(`${t}/`) && typeof e.rootBonePath == "string")?.rootBonePath ?? null;
}
function ro(e, t) {
	let n = e, r = /* @__PURE__ */ new Set();
	for (; typeof n.parentPathId == "number";) {
		if (typeof n.pathId == "number") {
			if (r.has(n.pathId)) throw Error(`Runtime prefab graph contains a parent cycle at PathID ${n.pathId}.`);
			r.add(n.pathId);
		}
		let e = t.get(n.parentPathId);
		if (!e) break;
		n = e;
	}
	return n;
}
function io(e) {
	let t = e.transformPath?.split("/")[0];
	return t ? `${e.runtimePartIndex ?? -1}:${t}` : null;
}
function ao(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of Ka(e)?.meshes ?? []) {
		if (typeof r.rendererTransformPathId != "number") continue;
		let e = t.get(r.rendererTransformPathId);
		if (!e) continue;
		let i = ro(e, t), a = io(e);
		if (!a || typeof i.pathId != "number") continue;
		let o = n.get(a);
		if (o !== void 0 && o !== i.pathId) throw Error(`Runtime native meshes reference multiple Unity prefab instances for '${a}' (${o}, ${i.pathId}).`);
		n.set(a, i.pathId);
	}
	return n;
}
function oo(t, n) {
	let r = Z(t);
	if (!r?.prefabGraphs?.length) return null;
	let i = new e.Group();
	i.name = "UnityPrefabSourceRoot", i.userData.pjskUnityPrefabSourceGraph = !0;
	let a = mo(t);
	i.scale.setScalar(a.scale), i.userData.pjskSourceScaleCorrection = a;
	let { sourceByPathId: o, pathCounts: s } = so(r), c = new Set([...s.entries()].filter(([, e]) => e > 1).map(([e]) => e)), { nodeByPathId: l, nodeByPath: u } = co(r, o, ao(t, o));
	uo(i, l, o), i.updateMatrixWorld(!0);
	let d = po(i), f = r.bodyHeadAssembly;
	if (!qa(f)) throw Error("Runtime package must provide the official model_combine_setup body/head assembly.");
	let p = Q(u, [f.parentAttachPath]), m = Q(u, [f.childRootPath]), h = Q(u, [f.childOriginPath]);
	if (!p || !m || !h) throw Error("Official model_combine_setup body/head roots were not fully resolved.");
	let g = eo(t, m.path), _ = $a(i, u, l, f, g), v = no(t, p.path.split("/")[0]), y = v ? u.get(v) ?? null : null, b = po(i), ee = d - b, te = fo(u, n), ne = {
		active: !0,
		sourcePath: _.bodyNodeA.path,
		targetPath: _.faceNodeA.path,
		reason: null,
		setupVersion: String(r.version ?? ""),
		sourceScaleCorrection: a,
		mountedHeadRootCount: 1,
		mountedHeadOriginPaths: [_.faceNodeA.path],
		assemblyCounts: {
			inputTransforms: d,
			retainedTransforms: b,
			removedTransforms: ee,
			capturedCommonRemovedTransforms: 14,
			removedAtLeastCapturedCommonCount: ee >= 14
		},
		targetCount: te.length,
		targetPaths: te.slice(0, 24).map((e) => String(e.source.userData.pjskTransformPath ?? e.source.name)),
		keyNodes: {
			runtimeMount: null,
			modelCombineBodyNeck: qo(_.bodyNodeA.node, i),
			modelCombineFaceNeck: qo(_.faceNodeA.node, i)
		}
	};
	return {
		root: i,
		nodeByPath: u,
		nodeByPathId: l,
		ambiguousPaths: c,
		meshCarrierBindings: te,
		bodyAttach: _.faceNodeA.node,
		bodyAttachPath: p.path,
		headRoot: _.faceNodeA.node,
		headRootPath: _.faceNodeA.path,
		headOrigin: _.faceNodeA.node,
		headOriginPath: _.faceNodeA.path,
		bodyRootBone: y,
		bodyRootBonePath: v,
		headRendererPaths: g,
		debug: ne
	};
}
function so(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
	for (let r of e.prefabGraphs ?? []) for (let e of r.transforms ?? []) typeof e.pathId != "number" || !e.transformPath || (t.set(e.pathId, e), n.set(e.transformPath, (n.get(e.transformPath) ?? 0) + 1));
	return {
		sourceByPathId: t,
		pathCounts: n
	};
}
function co(e, t, n) {
	let r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
	for (let a of e.prefabGraphs ?? []) for (let e of a.transforms ?? []) lo(e, t, n, r, i);
	return {
		nodeByPathId: r,
		nodeByPath: i
	};
}
function lo(t, n, r, i, a) {
	if (typeof t.pathId != "number" || !t.transformPath) return;
	let o = new e.Object3D();
	o.name = t.name ?? t.transformPath.split("/").pop() ?? `path_${t.pathId}`, o.userData.pjskTransformPath = t.transformPath, o.userData.pjskRuntimePartIndex = t.runtimePartIndex, o.userData.pjskPoseRoot = t.poseRoot ?? null, o.position.copy(vr(B(t.localPosition, new e.Vector3()))), o.quaternion.copy(br(_r(t.localRotation))), o.scale.copy(B(t.localScale, new e.Vector3(1, 1, 1))), o.updateMatrix(), i.set(t.pathId, o);
	let s = ro(t, n), c = r.get(io(t) ?? "");
	(c === void 0 || c === s.pathId || !a.has(t.transformPath)) && a.set(t.transformPath, o);
}
function uo(e, t, n) {
	for (let [r, i] of t.entries()) {
		let a = n.get(r)?.parentPathId;
		((typeof a == "number" ? t.get(a) : null) ?? e).add(i);
	}
}
function fo(e, t) {
	if (!t) return [];
	let n = [], r = ra(t);
	for (let [t, i] of e.entries()) {
		let e = r.get(t);
		e && n.push({
			source: i,
			target: e
		});
	}
	return n;
}
function po(e) {
	let t = 0;
	return e.traverse((n) => {
		n !== e && (t += 1);
	}), t;
}
function mo(e) {
	let t = X(e), n = X(t.character ?? t.Character), r = X(t.bodyManifest ?? t.BodyManifest);
	return {
		characterHeightMeters: Ga(n.characterHeightMeters ?? n.CharacterHeightMeters ?? r.CharacterHeightMeters ?? r.characterHeightMeters),
		scale: 1,
		reason: "presentation-module-applies-position-scale"
	};
}
function ho(e, t) {
	let n = Ka(t), r = n?.meshes ?? [];
	if (!n || r.length === 0) return {
		meshCount: 0,
		boneCount: e.nodeByPath.size,
		skinnedMeshCount: 0,
		skinBindings: [],
		error: "Unity runtime nativeMeshes version 0414 is missing or empty.",
		warnings: n?.warnings ?? []
	};
	let i = 0, a = 0, o = [], s = [...n.warnings ?? []], c = [];
	e.root.updateMatrixWorld(!0);
	for (let n of r) {
		if (to(t, n)) continue;
		let r = go(e, n, s, c);
		i += +!!r.installed, a += +!!r.skinned, r.skinBinding && o.push(r.skinBinding);
	}
	return e.root.updateMatrixWorld(!0), {
		meshCount: i,
		boneCount: e.nodeByPath.size,
		skinnedMeshCount: a,
		skinBindings: o,
		error: c.length > 0 ? c.join(" ") : i > 0 ? null : "Unity runtime nativeMeshes did not produce any renderable mesh.",
		warnings: s
	};
}
function go(t, n, r, i) {
	let a = n.bonePaths ?? [], o = n.bonePathIds ?? [];
	if (!vo(t, n, a, o, r, i)) return {
		installed: !1,
		skinned: !1
	};
	let s = yo(t, n, r, i);
	if (!s) return {
		installed: !1,
		skinned: !1
	};
	let c = Ao(n);
	if (!c) return r.push(`Native mesh '${_o(n)}' skipped: invalid geometry payload.`), {
		installed: !1,
		skinned: !1
	};
	let l = bo(n, c), u = n.meshName ?? n.meshPath?.split("/").pop() ?? "UnityNativeMesh", d = xo(t, a, o);
	if (a.length > 0 && d.length !== a.length) {
		let e = `Native mesh '${n.meshPath ?? u}' skipped: ${a.length - d.length} skin bones were unresolved.`;
		return r.push(e), i.push(e), c.dispose(), {
			installed: !1,
			skinned: !1
		};
	}
	let f = a.length > 0 ? new e.SkinnedMesh(c, l) : new e.Mesh(c, l);
	So(f, u, n, s);
	let p = f instanceof e.SkinnedMesh ? Co(t, n, f, d, u, r) : void 0;
	return {
		installed: !0,
		skinned: f instanceof e.SkinnedMesh,
		skinBinding: p
	};
}
function _o(e) {
	return e.meshPath ?? e.meshName ?? "<unnamed>";
}
function vo(e, t, n, r, i, a) {
	let o = [
		...typeof t.rendererTransformPathId == "number" ? [] : [t.rendererTransformPath],
		...r.length === 0 ? n : [],
		...typeof t.rootBonePathId == "number" ? [] : [t.rootBonePath]
	].filter((t) => !!(t && e.ambiguousPaths.has(t)));
	if (o.length > 0) {
		let e = `Native mesh '${_o(t)}' has an ambiguous legacy PathID-less skin binding (${[...new Set(o)].join(", ")}); regenerate it with a current Haruki-3D-Exporter.`;
		return i.push(e), a.push(e), !1;
	}
	if (r.length > 0 && r.length !== n.length) {
		let e = `Native mesh '${_o(t)}' has ${n.length} bone paths but ${r.length} bone PathIDs; regenerate it with a current Haruki-3D-Exporter.`;
		return i.push(e), a.push(e), !1;
	}
	return !0;
}
function yo(e, t, n, r) {
	let i = t.rendererTransformPath, a = typeof t.rendererTransformPathId == "number" ? e.nodeByPathId.get(t.rendererTransformPathId) : i ? e.nodeByPath.get(i) : null;
	if (a) return a;
	let o = `Native mesh '${_o(t)}' skipped: renderer transform '${i ?? "<null>"}' was not found.`;
	return n.push(o), typeof t.rendererTransformPathId == "number" && r.push(o), null;
}
function bo(t, n) {
	let r = (t.submeshes ?? []).map((r) => {
		if (!r.materialKey || typeof r.slotIndex != "number") throw Error(`Native mesh '${_o(t)}' has a submesh without material identity; regenerate it with Haruki-3D-Exporter materialKey runtime support.`);
		let i = new e.MeshBasicMaterial({
			color: 16777215,
			vertexColors: n.hasAttribute("color")
		});
		return i.name = r.materialName ?? t.meshName ?? t.meshPath ?? "native_material", i.userData.pjskMaterialKey = r.materialKey, i.userData.pjskMaterialSlotIndex = r.slotIndex, i;
	});
	return r.length > 0 ? r : [new e.MeshBasicMaterial({ color: 16777215 })];
}
function xo(e, t, n) {
	return t.map((t, r) => n.length > 0 ? e.nodeByPathId.get(n[r]) : e.nodeByPath.get(t)).filter((e) => !!e);
}
function So(e, t, n, r) {
	e.name = t, e.userData.pjskNativeUnityMesh = !0, e.userData.pjskPartKind = n.partKind ?? null, e.userData.pjskRendererPathId = n.rendererPathId ?? null, e.frustumCulled = !1, r.add(e);
}
function Co(t, n, r, i, a, o) {
	t.root.updateMatrixWorld(!0), r.updateMatrixWorld(!0);
	let s = ko(n, i.length, o), c = r.matrixWorld.clone();
	wo(s, c);
	let l = new e.Skeleton(i, s.length > 0 ? s : void 0);
	return s.length === 0 && l.calculateInverses(), r.bind(l, c), To(t, n, a, i, l);
}
function wo(e, t) {
	if (e.length === 0) return;
	let n = t.clone().invert();
	for (let t of e) t.multiply(n);
}
function To(e, t, n, r, i) {
	let a = t.rendererTransformPath, o = !!(a && e.headRendererPaths.includes(a)), s = Eo(e, t);
	return {
		meshName: n,
		partKind: t.partKind ?? null,
		rendererTransformPath: a ?? null,
		rootBonePath: t.rootBonePath ?? null,
		rootBoneResolved: s,
		effectiveRootBonePath: o ? e.bodyRootBonePath : t.rootBonePath ?? null,
		effectiveRootBoneResolved: o ? !!e.bodyRootBone : s,
		boneCount: r.length,
		...Do(r[0], i.boneInverses[0]),
		...Oo(r, i.boneInverses)
	};
}
function Eo(e, t) {
	return typeof t.rootBonePathId == "number" ? e.nodeByPathId.has(t.rootBonePathId) : t.rootBonePath ? e.nodeByPath.has(t.rootBonePath) : !1;
}
function Do(t, n) {
	let r = new e.Matrix4().multiplyMatrices(t.matrixWorld, n), i = new e.Vector3(), a = new e.Quaternion(), o = new e.Vector3();
	return r.decompose(i, a, o), {
		restTranslation: Go(i),
		restScale: Go(o)
	};
}
function Oo(t, n) {
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
function ko(t, n, r) {
	let i = t.boneInverseBindMatrices ?? [];
	if (n === 0 || i.length === 0) return [];
	if (i.length !== n * 16) return r.push(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has ${i.length} inverse bind matrix floats for ${n} bones; expected ${n * 16}.`), [];
	let a = [];
	for (let t = 0; t < i.length; t += 16) a.push(new e.Matrix4().fromArray(i, t));
	return a;
}
function Ao(t) {
	let n = t.positions ?? [];
	if (n.length === 0 || n.length % 3 != 0) return null;
	let r = n.length / 3, i = new e.BufferGeometry();
	return i.setAttribute("position", new e.Float32BufferAttribute(n, 3)), jo(i, t, r), Po(i, t.submeshes ?? []), Fo(i, t.morphTargets ?? [], r), i.computeBoundingSphere(), i;
}
function jo(t, n, r) {
	Mo(t, "normal", n.normals, 3, r), n.tangents?.length === r * 4 && t.setAttribute("tangent", new e.Float32BufferAttribute(n.tangents, 4)), Mo(t, "uv", n.uv0, 2, r), Mo(t, "uv1", n.uv1, 2, r), n.uv2?.length === r * 2 && t.setAttribute("uv2", new e.Float32BufferAttribute(n.uv2, 2)), Mo(t, "color", n.colors, 4, r), No(t, "skinIndex", n.skinIndices, 4, r), Mo(t, "skinWeight", n.skinWeights, 4, r);
}
function Mo(t, n, r, i, a) {
	r?.length === a * i && t.setAttribute(n, new e.Float32BufferAttribute(r, i));
}
function No(t, n, r, i, a) {
	r?.length === a * i && t.setAttribute(n, new e.Uint16BufferAttribute(r, i));
}
function Po(e, t) {
	let n = [];
	for (let r of t) {
		let t = n.length, i = r.indices ?? [];
		n.push(...i), e.addGroup(t, i.length, e.groups.length);
	}
	n.length > 0 && e.setIndex(n);
}
function Fo(e, t, n) {
	let r = [], i = [];
	for (let e of t) Io(e, n, r, i);
	r.length > 0 && (e.morphAttributes.position = r, e.morphTargetsRelative = !0), i.length === r.length && i.length > 0 && (e.morphAttributes.normal = i);
}
function Io(t, n, r, i) {
	let a = t.indices ?? [], o = t.positionDeltas ?? [];
	if (a.length === 0 || o.length !== a.length * 3) return;
	let s = new Float32Array(n * 3), c = t.normalDeltas?.length === a.length * 3 ? new Float32Array(n * 3) : null;
	for (let e = 0; e < a.length; e += 1) Lo(a[e], e, n, o, s), c && t.normalDeltas && Lo(a[e], e, n, t.normalDeltas, c);
	let l = new e.BufferAttribute(s, 3);
	if (l.name = t.name ?? `morph_${r.length}`, r.push(l), c) {
		let t = new e.BufferAttribute(c, 3);
		t.name = l.name, i.push(t);
	}
}
function Lo(e, t, n, r, i) {
	!Number.isInteger(e) || e < 0 || e >= n || (i[e * 3] = r[t * 3] ?? 0, i[e * 3 + 1] = r[t * 3 + 1] ?? 0, i[e * 3 + 2] = r[t * 3 + 2] ?? 0);
}
function Ro(e, t, n, r) {
	e.root.updateMatrixWorld(!0);
	let i = r ? r.update() : pa(e, Z(t)?.constraintSetup, n);
	for (let t of e.meshCarrierBindings) t.target.position.copy(t.source.position), t.target.quaternion.copy(t.source.quaternion), t.target.scale.copy(t.source.scale), t.target.updateMatrix();
	return e.root.updateMatrixWorld(!0), i;
}
function zo(e, t, n) {
	let r = Z(t)?.constraintSetup;
	return r ? new fa(e, r, n) : null;
}
function Bo(e, t, n) {
	let r = {
		...e?.debug ?? n,
		setupVersion: Vo(t)
	};
	if (!e) return r;
	let i = e.root;
	i.updateMatrixWorld(!0);
	let a = Z(t)?.bodyHeadAssembly, o = ra(i), s = (t) => {
		let n = Q(e.nodeByPath, t) ?? Ho(o, t);
		return n ? qo(n.node, i) : null;
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
		positionRoots: Jo(i),
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
function Vo(e) {
	let t = X(e), n = X(t.pjskSpringBone ?? t.PjskSpringBone), r = X(t.runtimeUnitySetup ?? t.RuntimeUnitySetup ?? n.runtimeUnitySetup ?? n.RuntimeUnitySetup);
	return String(r.version ?? r.Version ?? "");
}
function Ho(e, t) {
	for (let n of t) {
		let t = e.get(n);
		if (t) return {
			node: t,
			path: n
		};
	}
	return null;
}
function Uo(e) {
	return e.replace(/_\d+$/, "");
}
function Wo(e, t, n = !1) {
	let r = [], i = e;
	for (; i && i !== t;) i.name && r.push(n ? Uo(i.name) : i.name), i = i.parent;
	return r.reverse().join("/");
}
function Go(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5))
	};
}
function Ko(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5)),
		w: Number(e.w.toFixed(5))
	};
}
function qo(t, n) {
	t.updateMatrixWorld(!0);
	let r = new e.Vector3(), i = new e.Quaternion(), a = new e.Vector3(0, 0, 1);
	return t.getWorldPosition(r), t.getWorldQuaternion(i), a.applyQuaternion(i).normalize(), {
		path: Wo(t, n),
		canonicalPath: Wo(t, n, !0),
		parentPath: t.parent && t.parent !== n ? Wo(t.parent, n) : null,
		destroyed: t.userData.pjskModelCombineDestroyed === !0,
		localPosition: Go(t.position),
		localQuaternion: Ko(t.quaternion),
		worldPosition: Go(r),
		worldQuaternion: Ko(i),
		worldForward: Go(a)
	};
}
function Jo(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	return e.updateMatrixWorld(!0), e.traverse((r) => {
		if (r === e || !r.name || n.has(r)) return;
		let i = Wo(r, e, !0), a = i === "face/Position", o = i === "body/Position", s = i.endsWith("/Position") && i.split("/").some((e) => e.startsWith("mdl_chr_"));
		!a && !o && !s || (n.add(r), t.push(qo(r, e)));
	}), t;
}
var Yo = {
	asRecord: X,
	readRuntimeNumber: Ga,
	readRuntimeUnitySetup0414: Z,
	readRuntimeNativeMeshSet0414: Ka,
	resolvePrefabGraphNode: Q,
	isModelCombineSetupAssembly: qa,
	setParentKeepingLocal: Ja,
	drainChildrenKeepingLocal: Ya,
	moveFaceRendererTransforms: Xa,
	detachRuntimeSubtree: Za,
	replacePathIdNodeReferences: Qa,
	collectOfficialHeadRendererPaths: eo,
	isDestroyedStaticFaceRenderer: to,
	resolveOfficialBodyRootBone: no,
	resolvePrefabInstanceRoot: ro,
	prefabInstanceKey: io,
	resolvePreferredPrefabRoots: ao,
	indexPrefabTransformSources: so,
	buildPrefabTransformNodes: co,
	addPrefabTransformNode: lo,
	attachPrefabTransformNodes: uo,
	buildMeshCarrierBindings: fo,
	countRuntimeTransforms: po,
	resolveUnityPrefabSourceScaleCorrection: mo,
	nativeMeshLabel: _o,
	validateNativeMeshBindingSource: vo,
	resolveNativeMeshParent: yo,
	buildNativeMeshMaterials: bo,
	resolveNativeMeshBones: xo,
	prepareAndMountNativeMesh: So,
	convertUnityBindMatricesToThree: wo,
	resolveNativeRootBoneStatus: Eo,
	makeSkinRestTransform: Do,
	measureSkinRestMatrixSpread: Oo,
	buildUnityRuntimeBoneInverseBindMatrices: ko,
	buildUnityRuntimeNativeGeometry: Ao,
	addNativeGeometryAttributes: jo,
	addFloatGeometryAttribute: Mo,
	addUint16GeometryAttribute: No,
	addNativeGeometryIndices: Po,
	addNativeGeometryMorphTargets: Fo,
	addNativeGeometryMorphTarget: Io,
	copyNativeMorphDelta: Lo,
	readRuntimeUnitySetupVersion: Vo,
	resolvePrefabNodeCandidate: Ho,
	stripThreeDuplicateSuffix: Uo,
	buildObjectPath: Wo,
	vectorDebugSnapshot: Go,
	quaternionDebugSnapshot: Ko,
	makePrefabNodeDebug: qo,
	collectPrefabPositionRootDebug: Jo
};
//#endregion
//#region src/engine/runtimeMotion.ts
function $(e) {
	return e && typeof e == "object" ? e : {};
}
function Xo(e, t) {
	return /(?:^|[_-])loop$/i.test(e ?? "") || /(?:^|[_-])loop(?:\.json)?$/i.test(t?.split("/").pop() ?? "");
}
function Zo(e, t, n, r, i = 1e-4) {
	let a = n * t, o = r * t;
	for (let n = 0; n < t; n += 1) if (Math.abs(e[a + n] - e[o + n]) > i) return !1;
	return !0;
}
function Qo(e, t) {
	let n = e[t], r = e[t + 1], i = e[t + 2], a = e[t + 3], o = Math.hypot(n, r, i, a);
	if (o < 1e-8) {
		e[t] = 0, e[t + 1] = 0, e[t + 2] = 0, e[t + 3] = 1;
		return;
	}
	e[t] = n / o, e[t + 1] = r / o, e[t + 2] = i / o, e[t + 3] = a / o;
}
function $o(e, t) {
	if (t === 4) for (let n = t; n < e.length; n += t) {
		let r = n - t;
		e[r] * e[n] + e[r + 1] * e[n + 1] + e[r + 2] * e[n + 2] + e[r + 3] * e[n + 3] < 0 && (e[n] *= -1, e[n + 1] *= -1, e[n + 2] *= -1, e[n + 3] *= -1);
	}
}
function es(t, n, r, i, a, o, s, c, l) {
	let u = Math.max(s - o, 1e-6), d = e.MathUtils.clamp((l - o) / u, 0, 1), f = d * d, p = f * d, m = (r - t) / Math.max(s - a, 1e-6), h = (i - n) / Math.max(c - o, 1e-6), g = 2 * p - 3 * f + 1, _ = p - 2 * f + d, v = -2 * p + 3 * f, y = p - f;
	return g * n + _ * u * m + v * r + y * u * h;
}
function ts(t, n, r) {
	let i = t instanceof e.QuaternionKeyframeTrack, a = t instanceof e.VectorKeyframeTrack && t.name.endsWith(".position");
	if (!i && !a) return t.clone();
	let o = ns(t, n);
	if (!o) return t.clone();
	let { stride: s, times: c, values: l } = o;
	return i && $o(l, s), rs(t, n, r, c, l, i);
}
function ns(e, t) {
	let n = e.getValueSize(), r = Array.from(e.times), i = Array.from(e.values), a = r.length;
	return a < 3 || t <= 0 ? null : (Math.abs(r[a - 1] - t) < .001 && Zo(i, n, 0, a - 1) && --a, a < 3 ? null : {
		stride: n,
		times: r.slice(0, a),
		values: i.slice(0, a * n)
	});
}
function rs(t, n, r, i, a, o) {
	let s = t.getValueSize(), c = i.length, l = Math.max(2, Math.round(n * r)), u = new Float32Array(l + 1), d = new Float32Array((l + 1) * s), f = 0;
	for (let e = 0; e <= l; e += 1) {
		let t = e === l ? n : n * e / l;
		if (u[e] = t, e === l) {
			is(d, e * s, s);
			continue;
		}
		for (; f < c - 1 && t > i[f + 1];) f += 1;
		os(d, e * s, s, a, as(i, f, n), t), o && Qo(d, e * s);
	}
	return o ? new e.QuaternionKeyframeTrack(t.name, u, d) : new e.VectorKeyframeTrack(t.name, u, d);
}
function is(e, t, n) {
	for (let r = 0; r < n; r += 1) e[t + r] = e[r];
}
function as(e, t, n) {
	let r = e.length, i = t, a = t + 1 < r ? t + 1 : 0, o = (i - 1 + r) % r, s = (a + 1) % r;
	return {
		indexes: [
			o,
			i,
			a,
			s
		],
		times: [
			e[o] - (o >= i ? n : 0),
			e[i],
			e[a] + (a <= i ? n : 0),
			e[s] + (s <= i ? n : 0)
		]
	};
}
function os(e, t, n, r, i, a) {
	let [o, s, c, l] = i.indexes, [u, d, f, p] = i.times;
	for (let i = 0; i < n; i += 1) e[t + i] = es(r[o * n + i], r[s * n + i], r[c * n + i], r[l * n + i], u, d, f, p, a);
}
function ss(e) {
	let t = e.tracks.filter((e) => e.times.length > 2);
	return t.length ? t.some((t) => t.times.length < Math.max(12, e.duration * 24)) : !1;
}
function cs(t, n = 60) {
	return ss(t) ? new e.AnimationClip(t.name, t.duration, t.tracks.map((e) => ts(e, t.duration, n))) : t;
}
function ls(e) {
	return /^(Head|Neck)\.(position|quaternion|scale)$/.test(e.name);
}
function us(e, t = /* @__PURE__ */ new Set()) {
	if (!e) return null;
	let n = e.tracks.filter((e) => /hair/i.test(e.name)), r = e.tracks.filter((e) => /^Head\./.test(e.name)), i = e.tracks.filter((e) => /^Neck\./.test(e.name)), a = e.tracks.filter((e) => /^(Position|Hip|Waist|Spine|Chest|Neck|Head)\./.test(e.name)), o = e.tracks.filter((e) => /\.(position|quaternion|scale)$/.test(e.name)), s = e.tracks.filter((e) => ds(e, t));
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
function ds(e, t) {
	if (t.size === 0) return !1;
	let n = e.name.split(".")[0];
	return t.has(n);
}
function fs(t) {
	return t.tracks.some(ls) ? new e.AnimationClip(`${t.name || "motion"}_no_head_tracks`, t.duration, t.tracks.filter((e) => !ls(e))) : t;
}
function ps(e, t) {
	return t ? e : fs(e);
}
function ms(e) {
	return /(?:^|\/)unity-motion\.msgpack\.br(?:$|[?#])/i.test(e);
}
function hs(e, t) {
	return e ? t ?? (ms(e) ? "unity-json" : null) : null;
}
function gs(e, t) {
	return `${t ?? "unknown"}:${e}`;
}
function _s(e) {
	let t = $(e), n = String(t.version ?? t.Version ?? ""), r = t.clips ?? t.Clips;
	if (n !== "0414" || !Array.isArray(r)) throw Error("Unity motion runtime must be version 0414 and contain clips.");
	let i = r.map(vs);
	if (!i.length) throw Error("Unity motion runtime contains no clips.");
	return {
		version: n,
		clips: i
	};
}
function vs(e) {
	let t = $(e), n = String(t.name ?? t.Name ?? "motion"), r = t.tracks ?? t.Tracks;
	if (!Array.isArray(r)) throw Error(`Unity motion clip ${n} contains no tracks.`);
	let i = r.map(ys);
	if (!i.length) throw Error(`Unity motion clip ${n} contains no valid tracks.`);
	return {
		name: n,
		tracks: i
	};
}
function ys(e) {
	let t = $(e), n = String(t.nodeKey ?? t.NodeKey ?? ""), r = String(t.property ?? t.Property ?? ""), i = Number(t.componentCount ?? t.ComponentCount), a = bs(t.times ?? t.Times), o = bs(t.values ?? t.Values);
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
function bs(e) {
	if (e instanceof Float32Array || e instanceof Uint16Array || e instanceof Uint32Array) return e;
	if (!Array.isArray(e)) return [];
	if (e.every((e) => typeof e == "number" && Number.isFinite(e))) return e;
	let t = e.map(Number);
	if (!t.every(Number.isFinite)) throw Error("Unity motion numeric array contains non-finite values.");
	return t;
}
function xs(t) {
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
function Ss(t) {
	return _s(t).clips.map((t) => {
		let n = t.tracks.map(xs), r = n.flatMap((e) => Array.from(e.times)).reduce((e, t) => Math.max(e, t), 0);
		return new e.AnimationClip(t.name, r, n);
	});
}
function Cs(e) {
	let t = $(e), n = $(t.motionPackage ?? t.MotionPackage), r = $(n.bodyMotionBindings ?? n.BodyMotionBindings), i = r.bindings ?? r.Bindings;
	return Array.isArray(i) ? {
		version: String(r.version ?? r.Version ?? ""),
		bindingMode: String(r.bindingMode ?? r.BindingMode ?? ""),
		warnings: ks(r.warnings ?? r.Warnings),
		bindings: i.map(ws).filter((e) => !!e)
	} : null;
}
function ws(e) {
	let t = $(e), n = Number(t.pathCrc ?? t.PathCrc), r = String(t.nodeKey ?? t.NodeKey ?? ""), i = String(t.leafName ?? t.LeafName ?? ""), a = t.targets ?? t.Targets;
	if (!Number.isFinite(n) || !r || !Array.isArray(a)) return null;
	let o = a.map(Ts).filter((e) => !!e);
	return {
		pathCrc: n,
		nodeKey: r,
		leafName: i,
		importedPath: As(t.importedPath ?? t.ImportedPath),
		sourceRest: Es(t.sourceRest ?? t.SourceRest),
		targetCount: Number(t.targetCount ?? t.TargetCount ?? o.length),
		targets: o
	};
}
function Ts(e) {
	let t = $(e), n = String(t.poseRoot ?? t.PoseRoot ?? ""), r = String(t.transformPath ?? t.TransformPath ?? ""), i = Number(t.pathId ?? t.PathId);
	return !n || !r || !Number.isFinite(i) ? null : {
		poseRoot: n,
		transformPath: r,
		pathId: i,
		rest: Es(t.rest ?? t.Rest)
	};
}
function Es(e) {
	let t = $(e), n = Ds(t.position ?? t.Position), r = Os(t.rotation ?? t.Rotation), i = Ds(t.scale ?? t.Scale);
	return !n || !r || !i ? null : {
		position: n,
		rotation: r,
		scale: i
	};
}
function Ds(t) {
	let n = $(t), r = Number(n.x ?? n.X), i = Number(n.y ?? n.Y), a = Number(n.z ?? n.Z);
	return Number.isFinite(r) && Number.isFinite(i) && Number.isFinite(a) ? new e.Vector3(r, i, a) : null;
}
function Os(t) {
	let n = $(t), r = Number(n.x ?? n.X), i = Number(n.y ?? n.Y), a = Number(n.z ?? n.Z), o = Number(n.w ?? n.W);
	return !Number.isFinite(r) || !Number.isFinite(i) || !Number.isFinite(a) || !Number.isFinite(o) ? null : new e.Quaternion(r, i, a, o).normalize();
}
function ks(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "string") : [];
}
function As(e) {
	return typeof e == "string" && e.length > 0 ? e : null;
}
function js(e, t) {
	let n = e.clone();
	return n.name = t, n;
}
function Ms(t, n, r, i, a) {
	if (a.poseRoot !== "face") return js(t, n);
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
	return js(t, n);
}
function Ns(e) {
	return e.poseRoot === "face" && /^face\/Position(?:\/Hip(?:\/Waist(?:\/Spine(?:\/Chest(?:\/Neck(?:\/Head)?)?)?)?)?)?$/.test(e.transformPath);
}
function Ps(e) {
	let t = $(e), n = $(t.pjskSpringBone ?? t.PjskSpringBone), r = $(t.runtimeUnitySetup ?? t.RuntimeUnitySetup ?? n.runtimeUnitySetup ?? n.RuntimeUnitySetup), i = r.version, a = i === "0414" || i === 414 ? $(r.bodyHeadAssembly) : {};
	return !!(a.parentingMode === "model_combine_setup" && a.parentAttachPath && a.childRootPath && a.childOriginPath);
}
function Fs(t, n, r) {
	let i = Cs(r), a = {
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
	let o = new Map(i.bindings.map((e) => [e.nodeKey, e])), s = ra(n), c = Ps(r), l = [], u = /* @__PURE__ */ new Set(), d = /* @__PURE__ */ new Set(), f = /* @__PURE__ */ new Set(), p = /* @__PURE__ */ new Set();
	for (let e of t.tracks) {
		let t = Is(e, {
			bindingByNodeKey: o,
			nodeByPath: s,
			suppressFaceAssemblyBridgeTargets: c,
			tracks: l,
			emittedTargets: u,
			resolvedBodyTargetPaths: d,
			resolvedFaceTargetPaths: f,
			sampleResolvedHeadTargets: p,
			debug: a
		});
		t === 0 ? zs(a, e.name) : a.resolvedTargetCount += t;
	}
	return a.emittedTrackCount = l.length, a.resolvedBodyTargetCount = d.size, a.resolvedFaceTargetCount = f.size, a.sampleResolvedHeadTargets = [...p], l.length === 0 ? {
		clip: null,
		debug: a,
		error: `Unity Prefab animation retarget failed: ${a.unresolvedTrackCount} unresolved tracks.`
	} : {
		clip: new e.AnimationClip(`${t.name || "motion"}_unity_prefab`, t.duration, l),
		debug: a,
		error: null
	};
}
function Is(e, t) {
	let n = e.name.lastIndexOf("."), r = n > 0 ? e.name.slice(0, n) : "", i = n > 0 ? e.name.slice(n + 1) : "", a = t.bindingByNodeKey.get(r);
	if (!a || !i) return 0;
	let o = 0;
	for (let n of a.targets) Ls(e, i, a, n, t) && (o += 1);
	return o;
}
function Ls(e, t, n, r, i) {
	if (i.suppressFaceAssemblyBridgeTargets && Ns(r)) return !1;
	let a = i.nodeByPath.get(r.transformPath);
	if (!a) return !1;
	let o = `${a.uuid}.${t}`;
	if (i.emittedTargets.has(o)) return i.debug.duplicateTargetTrackCount += 1, !1;
	let s = Ms(e, o, t, n, r);
	return s ? (i.emittedTargets.add(o), i.tracks.push(s), Rs(r, i), !0) : !1;
}
function Rs(e, t) {
	e.poseRoot === "body" && t.resolvedBodyTargetPaths.add(e.transformPath), e.poseRoot === "face" && t.resolvedFaceTargetPaths.add(e.transformPath), t.sampleResolvedHeadTargets.size < 16 && /(?:^|\/)(Position|Hip|Waist|Spine|Chest|Neck|Head)$/.test(e.transformPath) && t.sampleResolvedHeadTargets.add(e.transformPath);
}
function zs(e, t) {
	e.unresolvedTrackCount += 1, e.sampleUnresolvedTracks.length < 16 && e.sampleUnresolvedTracks.push(t);
}
//#endregion
//#region src/engine/animationPlaybackRuntime.ts
function Bs(e) {
	return e instanceof Error ? e.message : String(e);
}
async function Vs(e) {
	return Ss(await F(e));
}
var Hs = class {
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
		this.loadClips = e.loadClips ?? Vs, this.onLoopPromoted = e.onLoopPromoted ?? (() => void 0);
	}
	setSelection(e) {
		this.motionUrl = e?.motionUrl ?? null, this.motionKind = hs(this.motionUrl, e?.motionKind), this.loopUrl = e?.loopUrl ?? null, this.loopKind = hs(this.loopUrl, e?.loopKind);
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
		let n = !!(this.loopUrl && t.activeClipName && (t.activeClipName === this.queuedLoopClipName || Xo(t.activeClipName, this.loopUrl)));
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
		let r = n.find((e) => !Xo(e.name, this.motionUrl)) ?? n[0], i = this.preparePlayableClip(r, e, !0);
		if (!i) return { poseApplied: !1 };
		let a = null;
		if (this.loopUrl === this.motionUrl) {
			let t = n.find((e) => Xo(e.name, this.loopUrl)) ?? n.find((e) => e !== r) ?? null;
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
			bodyTrackDebug: us(this.action?.getClip() ?? null, t),
			bodyLoopTrackDebug: us(this.loopAction?.getClip() ?? null, t),
			bodyRetargetDebug: r,
			error: this.error
		};
	}
	async loadCachedClips(e, t, n, r) {
		let i = gs(e, t), a = this.clipCache.get(i);
		if (a) return a;
		if (t !== "unity-json") return n || (this.error = `Unity motion .msgpack.br is required for ${e}.`), null;
		try {
			let n = await this.loadClips(e, t);
			return this.clipCache.set(i, n), n;
		} catch (e) {
			return !n && r === this.revision && (this.error = Bs(e)), null;
		}
	}
	preparePlayableClip(e, t, n) {
		let r = ps(e, this.bodyHeadTracksEnabled);
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
		let i = Fs(r, t.root, t.runtimeExtension);
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
		let n = cs(e, 60);
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
export { Xt as $, nr as A, zn as B, vr as C, cr as D, Fn as E, ir as F, lr as G, or as H, Yn as I, Un as J, Rn as K, er as L, rr as M, ar as N, Wn as O, tr as P, P as Q, Gn as R, xr as S, B as T, dr as U, sr as V, ur as W, cn as X, Bn as Y, an as Z, ra as _, us as a, Wr as b, Wa as c, ho as d, Wt as et, Bo as f, pa as g, fa as h, hs as i, r as it, $n as j, Vn as k, oo as l, Yo as m, cs as n, Ut as nt, ps as o, Ro as p, Hn as q, Ss as r, f as rt, Fs as s, Hs as t, lt as tt, zo as u, na as v, br as w, ta as x, Or as y, qn as z };

