import * as e from "three";
//#region src/kernel/renderRecipe.ts
var t = /^\d+(?::[A-Za-z0-9_/-]+)?$/;
function n(e) {
	let n = String(e.roleId ?? "").trim();
	if (!t.test(n)) throw Error("roleId must be '<characterId>:<unit>' or '<characterId>'.");
	let r = e.motionRoleId == null ? null : String(e.motionRoleId).trim();
	if (r !== null && !t.test(r)) throw Error("motionRoleId must be null, '<characterId>:<unit>' or '<characterId>'.");
	let i = e.motionType ?? "costume";
	if (i !== "costume" && i !== "result" && i !== "preview") throw Error("motionType must be \"costume\", \"result\", \"preview\" or null.");
	let a = (t) => {
		let n = e[t];
		if (!Number.isInteger(n) || Number(n) <= 0) throw Error(`${t} must be a positive integer.`);
		return Number(n);
	}, o = e.headPackagePath, s = o == null ? null : String(o).trim();
	if (s !== null && (s.length === 0 || s.length > 1024 || s.includes("\0"))) throw Error("headPackagePath must be null or a non-empty string of at most 1024 characters without NUL bytes.");
	let c = e.headOptionalCostume3dId == null ? null : a("headOptionalCostume3dId"), l = e.hairFromCharacterId == null ? null : a("hairFromCharacterId");
	return {
		roleId: n,
		hairFromCharacterId: l,
		hairFromCostume3dId: l == null || e.hairFromCostume3dId == null ? null : a("hairFromCostume3dId"),
		headFromCharacterId: e.headFromCharacterId == null ? null : a("headFromCharacterId"),
		bodyFromCharacterId: e.bodyFromCharacterId == null ? null : a("bodyFromCharacterId"),
		bodyCostume3dId: a("bodyCostume3dId"),
		headCostume3dId: a("headCostume3dId"),
		headPackagePath: s,
		hairCostume3dId: a("hairCostume3dId"),
		headOptionalCostume3dId: c,
		motionRoleId: r,
		motionType: i
	};
}
function r(e) {
	return e.kind === "head_optional";
}
function i(e) {
	let n = String(e.roleId ?? "").trim();
	if (!t.test(n)) throw Error("roleId must be '<characterId>:<unit>' or '<characterId>'.");
	let r = e.headOptionalCostume3dId;
	if (!Number.isInteger(r) || Number(r) <= 0) throw Error("headOptionalCostume3dId must be a positive integer.");
	return {
		kind: "head_optional",
		roleId: n,
		headOptionalCostume3dId: Number(r)
	};
}
//#endregion
//#region src/base/browserCharacterRuntime.ts
var a = 1 / 60, o = 5;
function s(e, t) {
	let n = 0, r = !1, i = !1, s = Promise.resolve(), l = null, u = null, d = null, f = 0, p = 0, m = () => {
		if (i) throw Error("Haruki 3D runtime has been destroyed.");
	}, h = (n) => {
		m();
		let r = c(n);
		if (u?.key === r) return u.promise;
		let i = Promise.all([e.waitForPostProcessorReady?.() ?? Promise.resolve(), e.loadRenderRecipe({
			...n,
			content: t
		})]).then(() => void 0);
		return u = {
			key: r,
			promise: i
		}, s = i.then(() => void 0, () => void 0), i.catch(() => {
			u?.promise === i && (u = null);
		}), i;
	}, g = (t) => {
		if (!r || i) return;
		d === null && (d = t), f += Math.min(Math.max((t - d) / 1e3, 0), a * o), d = t;
		let s = 0;
		for (; f >= a && s < o;) p += a, e.stepRuntimeFrame(a, {
			advanceAnimation: !0,
			elapsedTime: p
		}), f -= a, s += 1;
		e.renderFrame(), n = requestAnimationFrame(g);
	};
	return {
		prepare: h,
		async load(t) {
			await h(t), !i && (e.stepRuntimeFrame(0, {
				advanceAnimation: !1,
				elapsedTime: p
			}), e.renderFrame());
		},
		play() {
			m(), !r && (r = !0, d = null, f = 0, n = requestAnimationFrame(g));
		},
		pause() {
			r && (r = !1, cancelAnimationFrame(n), n = 0, d = null, f = 0);
		},
		resize(t, n) {
			m(), e.setViewportSize(t, n), e.renderFrame();
		},
		setCharacterYawDegrees(t) {
			m(), e.setCharacterYawDegrees(t), r || e.renderFrame();
		},
		setViewYawDegrees(t) {
			m(), e.setViewYawDegrees(t), r || e.renderFrame();
		},
		setViewZoom(t) {
			m();
			let n = e.setViewZoom?.(t) ?? {
				zoom: t,
				heightOffset: 0
			};
			return r || e.renderFrame(), n;
		},
		setViewHeightOffset(t) {
			m();
			let n = e.setViewHeightOffset?.(t) ?? {
				zoom: 1,
				heightOffset: t
			};
			return r || e.renderFrame(), n;
		},
		async captureImage(t) {
			if (m(), !e.captureImage) throw Error("this engine cannot capture an image");
			return e.captureImage(t);
		},
		async setBackground(n) {
			m(), await e.setBackgroundMode?.(n, t), !r && !i && e.renderFrame();
		},
		destroy() {
			return l || (i = !0, u = null, r = !1, cancelAnimationFrame(n), n = 0, l = s.then(() => {
				e.destroy();
			}), l);
		}
	};
}
function c(e) {
	return r(e) ? [
		"head_optional",
		e.roleId,
		e.headOptionalCostume3dId
	].join("\0") : [
		"character",
		e.roleId,
		e.bodyCostume3dId,
		e.headCostume3dId,
		e.headPackagePath ?? "",
		e.hairCostume3dId,
		e.headOptionalCostume3dId ?? "",
		e.motionRoleId ?? "",
		e.motionType ?? "costume",
		e.hairFromCharacterId ?? "",
		e.hairFromCostume3dId ?? "",
		e.headFromCharacterId ?? "",
		e.bodyFromCharacterId ?? ""
	].join("\0");
}
//#endregion
//#region src/parts/runtimePartComposer.ts
var l = /* @__PURE__ */ new WeakMap();
function u(e) {
	let t = e.toLowerCase();
	if (t === "head_optional" || t === "accessory") return "head_optional";
	if (t === "body" || t === "head" || t === "hair") return t;
	throw Error(`Unsupported runtime part type: ${e}`);
}
function d(e) {
	let t = u(e.partType);
	return (t === "head" || t === "head_optional") && p(e.headCostume3dAssetbundleType) ? "head" : t === "head" && m(e.headCostume3dAssetbundleType) ? "head_optional" : t;
}
function f(e) {
	try {
		return d(e);
	} catch {
		return null;
	}
}
function p(e) {
	return (e ?? "").trim().toLowerCase() === "head_and_hair";
}
function m(e) {
	let t = (e ?? "").trim().toLowerCase();
	return t === "head_only" || t === "head_all" || t === "head_front" || t === "head_back";
}
function h(e, t) {
	return `${e}:${re(t)}`;
}
function g(e, t, n, r = {}) {
	return e.registry.filter((e) => e.characterId === t).filter((e) => r.unit === void 0 || ie(e.unit, r.unit)).filter((e) => f(e) === n).filter(O).sort((e, t) => e.costume3dId - t.costume3dId);
}
function _(e) {
	let { partSet: t, selection: n, activeRoleId: r } = e, i = h(n.characterId, n.unit);
	if (r !== null && i !== r) throw Error(`Custom switching is limited to role ${r}. Reload/select another role before switching to ${i}.`);
	let a = v(t, n.characterId, n.unit, "body", n.bodyCostume3dId), o = x(t, n), s = y(t, b(t, n), "hair"), c = {
		...n,
		headPackagePath: o.packagePath
	}, l = S(t, c, o), u = l && d(l.part) === "head" ? l : s, f = l && d(l.part) === "head_optional" ? l : null, p = C(t, n);
	A(n.characterId, n.unit, [
		a,
		u,
		f,
		p
	].filter(Boolean)), ee(t.compatibility, c, d(o));
	let m = [
		a,
		u,
		f,
		p
	].filter(Boolean), g = ae(o), _ = oe(m, g), w = t.role && h(t.role.characterId, t.role.unit) === i ? t.role : null;
	if (!w) throw Error(`The part set has no role ${i}.`);
	let T = [a, ...oe([
		u,
		f,
		p
	].filter(Boolean), g)].flatMap((e) => e.materialSlots ?? []);
	return {
		id: `custom-${[
			`content:${t.contentId}`,
			t.masterVersion ?? "unknown-master",
			i,
			`requested:${n.bodyCostume3dId}:${n.headCostume3dId}:${n.hairCostume3dId}:${n.headOptionalCostume3dId ?? "none"}`,
			`body:${a.packagePath ?? "unknown"}`,
			`head:${o.packagePath}`,
			`hair:${s.packagePath ?? "unknown"}`,
			`accessory:${p?.packagePath ?? f?.packagePath ?? "none"}`
		].map(encodeURIComponent).join("-")}`,
		displayName: `Custom ${i}`,
		characterId: n.characterId,
		characterHeightMeters: w.characterHeightMeters,
		skinColors: w.skinColors,
		materialSlots: T,
		runtimeExtension: ce(_)
	};
}
function v(e, t, n, r, i) {
	let a = D(e, t, n, r, i);
	if (!a) throw Error(`Missing ${r} registry entry for role ${h(t, n)}, costume3dId ${i}.`);
	return y(e, a, r);
}
function y(e, t, n) {
	if (!e.packages.has(t.packagePath)) throw Error(`Missing loaded ${n} package for role ${h(t.characterId, t.unit)}, ${T(t)}.`);
	return E(e.packages.get(t.packagePath), t);
}
function b(e, t) {
	let n = D(e, t.characterId, t.unit, "hair", t.hairCostume3dId);
	if (!n) throw Error(`Missing hair registry entry for role ${h(t.characterId, t.unit)}, costume3dId ${t.hairCostume3dId}.`);
	let r = x(e, t).headCostume3dAssetbundleType?.trim().toLowerCase(), i = r ? n.headTypeVariants?.[r] : void 0;
	return i ? {
		...n,
		bundlePath: i.bundlePath,
		packagePath: i.packagePath
	} : n;
}
function x(e, t) {
	let n = t.headPackagePath?.trim() || null, r = e.registry.filter((e) => e.characterId === t.characterId && ie(e.unit, t.unit) && e.costume3dId === t.headCostume3dId && ["head", "head_optional"].includes(f(e) ?? "") && O(e) && (n === null || e.packagePath === n)).sort((e, t) => {
		let n = e.packagePath.localeCompare(t.packagePath);
		return n === 0 ? d(e).localeCompare(d(t)) : n;
	});
	if (r.length === 0) {
		let e = n ? `, packagePath ${n}` : "";
		throw Error(`Missing head registry entry for role ${h(t.characterId, t.unit)}, costume3dId ${t.headCostume3dId}${e}.`);
	}
	if (new Set(r.map((e) => `${d(e)}|${e.packagePath}`)).size > 1) {
		let e = r.map((e) => `${d(e)}:${e.packagePath}`).join(", ");
		throw Error(`Ambiguous head registry entry for role ${h(t.characterId, t.unit)}, costume3dId ${t.headCostume3dId}; specify headPackagePath. Candidates: ${e}.`);
	}
	return r[0];
}
function S(e, t, n = x(e, t)) {
	if (k(n)) return null;
	if (!e.packages.has(n.packagePath)) throw Error(`Missing loaded head package for role ${h(t.characterId, t.unit)}, ${T(n)}.`);
	return E(e.packages.get(n.packagePath), n);
}
function C(e, t) {
	let n = w(e, t);
	if (!n || k(n)) return null;
	if (!e.packages.has(n.packagePath)) throw Error(`Missing loaded head_optional package for role ${h(t.characterId, t.unit)}, ${T(n)}.`);
	return E(e.packages.get(n.packagePath), n);
}
function w(e, t) {
	if (!t.headOptionalCostume3dId) return null;
	let n = e.registry.filter((e) => e.characterId === t.characterId && ie(e.unit, t.unit) && e.costume3dId === t.headOptionalCostume3dId && f(e) === "head_optional" && O(e)).sort((e, t) => e.packagePath.localeCompare(t.packagePath));
	if (n.length === 0) throw Error(`Missing head_optional registry entry for role ${h(t.characterId, t.unit)}, costume3dId ${t.headOptionalCostume3dId}.`);
	let r = new Set(n.map((e) => e.packagePath));
	if (r.size > 1) throw Error(`Ambiguous head_optional registry entry for role ${h(t.characterId, t.unit)}, costume3dId ${t.headOptionalCostume3dId}; the legacy selector cannot identify one original source. Candidates: ${[...r].join(", ")}.`);
	return n[0];
}
function T(e) {
	let t = [
		`costume3dId ${e.costume3dId}`,
		`partType ${d(e)}`,
		`packagePath ${e.packagePath}`
	];
	e.bundlePath && t.push(`bundlePath ${e.bundlePath}`), e.colorVariationBundlePath && t.push(`colorVariationBundlePath ${e.colorVariationBundlePath}`);
	let n = e.warnings?.[0];
	return n && t.push(`warning ${n}`), t.join(", ");
}
function E(e, t) {
	let n = f(t) ?? e.part.partType;
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
			modelAssetbundleName: t.modelAssetbundleName ?? e.part.modelAssetbundleName,
			headCostume3dAssetbundleType: t.headCostume3dAssetbundleType ?? e.part.headCostume3dAssetbundleType
		}
	};
}
function D(e, t, n, r, i) {
	return e.registry.find((e) => e.characterId === t && ie(e.unit, n) && e.costume3dId === i && f(e) === r && O(e));
}
function O(e) {
	return e.status !== "missing";
}
function k(e) {
	return e.status === "empty" && f(e) === "head_optional";
}
function A(e, t, n) {
	let r = n.find((n) => n.part.characterId !== e || !ie(n.part.unit, t));
	if (r) throw Error(`Part ${r.part.partType}/${r.part.costume3dId} belongs to role ${h(r.part.characterId, r.part.unit)}, not ${h(e, t)}.`);
}
function ee(e, t, n) {
	if (!e || n === "head") return;
	let r = ne(t.unit, t.headCostume3dId, t.hairCostume3dId);
	if (te(e).has(r)) throw Error(`Head ${t.headCostume3dId} and hair ${t.hairCostume3dId} are not available together.`);
}
function te(e) {
	if (!e) return /* @__PURE__ */ new Set();
	let t = l.get(e);
	if (t) return t;
	let n = new Set([...e.denied ?? [], ...(e.rules ?? []).filter((e) => e.state === "not_available")].map((e) => ne(e.unit, e.headCostume3dId, e.hairCostume3dId)));
	return l.set(e, n), n;
}
function ne(e, t, n) {
	return `${re(e)}|${t}|${n}`;
}
function re(e) {
	return e ?? "";
}
function ie(e, t) {
	return re(e) === re(t);
}
function ae(e) {
	return d(e) === "head_optional" ? {
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
function oe(e, t) {
	return e.filter((e) => se(e, t));
}
function se(e, t) {
	return t.activePartTypes.has(d(e.part));
}
function j(e) {
	return typeof e == "string" ? e : "";
}
function ce(e) {
	let t = ue(e);
	return {
		characterControllers: le(e),
		nativeMeshes: nt(e, t),
		pjskSpringBone: {
			raw: t.raw,
			runtimeUnitySetup: t
		}
	};
}
function le(e) {
	let t = e.findIndex((e) => {
		let t = d(e.part);
		return t === "head" || t === "hair";
	}), n = t >= 0 ? e[t].characterControllers ?? {} : {}, r = (e) => {
		if (Array.isArray(e)) return e.map(r);
		if (!N(e) || ArrayBuffer.isView(e)) return e;
		let n = {};
		for (let [i, a] of Object.entries(e)) n[i] = (i === "pathId" || i === "transformPathId") && typeof a == "number" ? M(a, t) : i === "raw" ? a : r(a);
		return n;
	};
	return r(n);
}
function ue(e) {
	let t = e.map((e, t) => Te(e, t)), n = t[0]?.setup ?? {}, r = t.map((e) => e.prefabGraph).filter((e) => e !== null), i = e.flatMap((e) => [...e.warnings ?? [], ...e.springBone?.warnings ?? []]), a = mt(t.flatMap((e) => e.activeRoots)), o = t.flatMap((e) => e.managers), s = t.flatMap((e) => e.bones), c = t.flatMap((e) => e.extraBones), l = t.flatMap((e) => e.colliders), u = t.flatMap((e) => e.constraints), d = He(t), f = de(i, d), p = qe(t, d), m = Ke(s, d), h = be(r);
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
		funit: ve(e),
		raw: ye(t),
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
			warnings: mt(t.flatMap((e) => ft(e.setup.constraintSetup?.warnings)))
		},
		managerColliderCaches: p,
		warnings: f
	};
	return fe(t, g, it(e)), g;
}
function de(e, t) {
	let n = t.filter((e) => e.sourceKind === "colliderFlag");
	return n.length > 0 && n.every((e) => pt(e.colliders).length > 0) ? e.filter((e) => !/has colliderFlag .* but no body colliders matched runtime CL_\* prefixes/.test(e)) : e;
}
function fe(e, t, n) {
	for (let r of e.filter((e) => e.partType === "head_optional")) {
		let i = r.prefabGraph, a = ut(j(r.runtime.mount?.attachNode)), o = a ? pe(e, a) : null, s = (i?.transforms ?? []).find((e) => e.parentPathId == null && j(e.transformPath) === "optional");
		if (!i || !o || !s || typeof o.pathId != "number" || typeof s.pathId != "number") {
			t.warnings?.push(`Head optional prefab '${j(r.runtime.part.modelAssetbundleName) || "<unknown>"}' was not instantiated: official prefab root 'optional' or active attach node '${a || "<missing>"}' was not found.`);
			continue;
		}
		let c = (i.monoBehaviours ?? []).find((e) => j(e.scriptName) === "CharacterAccessoryTransformController" && he(j(e.transformPath), "optional"));
		if (c) {
			let e = j(c.transformPath), a = (i.transforms ?? []).find((t) => j(t.transformPath) === e);
			a ? (ge(a, ot(r.runtime, n)), i.headOptionalControllerPath = e) : t.warnings?.push(`Head optional controller target '${e || "<missing>"}' was not found in prefab 'optional'.`);
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
		me(i, "optional"), s.parentPathId = o.pathId, o.childPathIds = [.../* @__PURE__ */ new Set([...o.childPathIds ?? [], s.pathId])], i.headOptionalAttachPath = j(o.transformPath), i.headOptionalPrefabRootPath = "optional";
	}
}
function pe(e, t) {
	for (let n of e) {
		if (n.partType === "head_optional" || !n.prefabGraph) continue;
		let e = n.prefabGraph.transforms ?? [], r = new Map(e.filter((e) => typeof e.pathId == "number").map((e) => [e.pathId, e])), i = new Map(P(n.prefabGraph.gameObjects).map((e) => [lt(e.pathId, NaN), e.activeSelf !== !1 && e.activeInHierarchy !== !1])), a = (e) => typeof e.gameObjectPathId != "number" || i.get(e.gameObjectPathId) !== !1, o = (e) => {
			if (!a(e)) return null;
			if (j(e.name) === t || ut(j(e.transformPath)) === t) return e;
			for (let t of e.childPathIds ?? []) {
				let e = r.get(t), n = e ? o(e) : null;
				if (n) return n;
			}
			return null;
		};
		for (let t of n.activeRoots) {
			let n = e.find((e) => e.parentPathId == null && j(e.transformPath) === t), r = n ? o(n) : null;
			if (r) return r;
		}
	}
	return null;
}
function me(e, t) {
	let n = (e) => he(j(e.transformPath), t);
	e.transforms = (e.transforms ?? []).filter(n), e.gameObjects = P(e.gameObjects).filter(n), e.renderers = P(e.renderers).filter(n), e.animators = P(e.animators).filter(n), e.monoBehaviours = (e.monoBehaviours ?? []).filter(n), e.constraints = P(e.constraints).filter(n), e.rootTransformPathIds = e.transforms.filter((e) => j(e.transformPath) === t).map((e) => e.pathId).filter((e) => typeof e == "number");
}
function he(e, t) {
	return e === t || e.startsWith(`${t}/`);
}
function ge(e, t) {
	let n = ct(t?.position, 0, 0, 0), r = ct(t?.rotationEulerDegrees, 0, 0, 0), i = ct(t?.scale, 1, 1, 1);
	e.localPosition = {
		X: n.x,
		Y: n.y,
		Z: n.z
	}, e.localRotation = _e(r), e.localScale = {
		X: Math.abs(i.x),
		Y: Math.abs(i.y),
		Z: Math.abs(i.z)
	};
}
function _e(e) {
	let t = e.x * Math.PI / 180, n = e.y * Math.PI / 180, r = e.z * Math.PI / 180, i = Math.cos(t / 2), a = Math.cos(n / 2), o = Math.cos(r / 2), s = Math.sin(t / 2), c = Math.sin(n / 2), l = Math.sin(r / 2);
	return {
		x: s * a * o - i * c * l,
		y: i * c * o + s * a * l,
		z: i * a * l + s * c * o,
		w: i * a * o - s * c * l
	};
}
function ve(e) {
	let t = e.map((e) => dt(e.springBone?.funit)).filter((e) => Object.keys(e).length > 0), n = (e, t) => typeof e[t] == "number" && Number.isFinite(e[t]) ? Math.max(Math.trunc(e[t]), 0) : 0, r = mt(t.flatMap((e) => ft(e.detectedScripts))).sort((e, t) => e.localeCompare(t));
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
function ye(e) {
	let t = e.filter((e) => e.partType === "body").flatMap((e) => e.extraBones), n = e.filter((e) => e.partType === "head" || e.partType === "hair" || e.partType === "head_optional").flatMap((e) => e.extraBones);
	return {
		body: { extraBones: t },
		head: { extraBones: n }
	};
}
function be(e) {
	let t = xe(e), n = Se(e);
	return !t || !Ce(e, "face") || !n ? null : {
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
function xe(e) {
	return ["body/Position/PositionOffset/Hip/Waist/Spine/Chest/Neck", "body/Position/Hip/Waist/Spine/Chest/Neck"].find((t) => Ce(e, t)) ?? null;
}
function Se(e) {
	return ["face/Position/Hip/Waist/Spine/Chest/Neck", "face/Position"].find((t) => Ce(e, t)) ?? null;
}
function Ce(e, t) {
	return e.some((e) => P(e?.transforms).some((e) => j(e.transformPath) === t));
}
function we(e) {
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
function Te(e, t) {
	let n = we(e), r = d(e.part), i = Ee(r, ft(n.activeRootProfile?.activeRoots)), a = De(Ie(n.managers, t, r), i), o = De(Ie(n.bones, t, r), i), s = De(Oe(n.extraBones, t, r), i), c = De(Ie(n.colliders, t, r), i), l = Ae(Ie(n.colliderBindings, t, r), o), u = je(Ie(n.managerColliderCaches, t, r), a), f = Me(n.constraintSetup, t, r, i);
	return Pe(a, o, u), {
		runtime: e,
		partIndex: t,
		partType: r,
		setup: n,
		prefabGraph: Ne(e.springBone?.prefabGraph, t),
		managers: a,
		bones: o,
		extraBones: s,
		colliders: c,
		colliderBindings: l,
		managerColliderCaches: u,
		constraints: f,
		activeRoots: i
	};
}
function Ee(e, t) {
	return e === "body" && t.includes("body") ? ["body"] : (e === "head" || e === "hair") && t.includes("face") ? ["face"] : e === "head_optional" && t.includes("optional") ? ["optional"] : t.length ? [t[0]] : [e === "body" ? "body" : "face"];
}
function De(e, t) {
	let n = new Set(t.map((e) => et(e)));
	return e.filter((e) => {
		let t = et(tt(e.nodePath) ?? e.poseRoot);
		return n.has(t);
	});
}
function Oe(e, t, n) {
	return Ie(e, t, n).map((e) => {
		let n = e, r = ke(n.gameObject ?? n.GameObject, t), i = ke(n.referenceBone ?? n.ReferenceBone, t);
		return n.gameObject = r, n.GameObject = r, n.referenceBone = i, n.ReferenceBone = i, n.nodePath = r?.transformPath ?? r?.TransformPath ?? null, n.poseRoot = tt(n.nodePath) ?? null, n;
	});
}
function ke(e, t) {
	if (!N(e)) return e;
	let n = { ...e };
	return typeof n.pathId == "number" && (n.pathId = M(n.pathId, t)), typeof n.PathId == "number" && (n.PathId = M(n.PathId, t)), n;
}
function Ae(e, t) {
	let n = new Set(t.map((e) => e.pathId).filter((e) => typeof e == "number"));
	return e.filter((e) => typeof e.sourceSpringBonePathId != "number" || n.has(e.sourceSpringBonePathId));
}
function je(e, t) {
	let n = new Set(t.map((e) => e.pathId).filter((e) => typeof e == "number"));
	return e.filter((e) => typeof e.managerPathId != "number" || n.has(e.managerPathId));
}
function Me(e, t, n, r) {
	let i = new Set(r.map((e) => et(e)));
	return Ie(e?.constraints, t, n).map((e) => {
		let n = P(e.sources).map((e) => {
			let n = { ...e };
			return typeof n.sourcePathId == "number" && (n.sourcePathId = M(n.sourcePathId, t)), n;
		});
		return typeof e.worldUpObjectPathId == "number" && (e.worldUpObjectPathId = M(e.worldUpObjectPathId, t)), {
			...e,
			sources: n
		};
	}).filter((e) => {
		let t = et(tt(e.ownerPath));
		return !t || i.has(t);
	});
}
function Ne(e, t) {
	if (!N(e)) return null;
	let n = { ...e };
	return n.runtimePartIndex = t, n.transforms = P(e.transforms).map((e) => {
		let n = {
			...e,
			runtimePartIndex: t
		};
		return typeof n.pathId == "number" && (n.pathId = M(n.pathId, t)), typeof n.PathId == "number" && (n.PathId = M(n.PathId, t)), typeof n.parentPathId == "number" && (n.parentPathId = M(n.parentPathId, t)), Array.isArray(n.childPathIds) && (n.childPathIds = n.childPathIds.map((e) => typeof e == "number" ? M(e, t) : e)), n;
	}), n.monoBehaviours = P(e.monoBehaviours).map((e) => {
		let n = {
			...e,
			runtimePartIndex: t
		};
		return typeof n.pathId == "number" && (n.pathId = M(n.pathId, t)), n;
	}), n;
}
function Pe(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = n.nodePath, i = t.filter((t) => Fe(t.nodePath, e)).map((e) => e.pathId).filter((e) => typeof e == "number");
		i.length && (n.bonePathIds = i, typeof n.pathId == "number" && r.set(n.pathId, i));
	}
	for (let e of n) {
		let t = typeof e.managerPathId == "number" ? r.get(e.managerPathId) : void 0;
		t?.length && (e.springBonePathIds = t);
	}
}
function Fe(e, t) {
	return !e || !t ? !1 : e === t || e.startsWith(`${t}/`);
}
function Ie(e, t, n) {
	return Array.isArray(e) ? e.map((e) => {
		if (!N(e)) return e;
		let r = { ...e };
		return r.runtimePartIndex = t, r.runtimePartType = n, typeof r.pathId == "number" && (r.pathId = M(r.pathId, t)), typeof r.index == "number" && (r.index = M(r.index, t)), typeof r.managerPathId == "number" && (r.managerPathId = M(r.managerPathId, t)), typeof r.pivotSourcePathId == "number" && (r.pivotSourcePathId = M(r.pivotSourcePathId, t)), typeof r.sourceSpringBonePathId == "number" && (r.sourceSpringBonePathId = M(r.sourceSpringBonePathId, t)), Array.isArray(r.bonePathIds) && (r.bonePathIds = r.bonePathIds.map((e) => typeof e == "number" ? M(e, t) : e)), Array.isArray(r.forceProviders) && (r.forceProviders = Le(r.forceProviders, t)), Array.isArray(r.directColliderPathIds) && (r.directColliderPathIds = r.directColliderPathIds.map((e) => typeof e == "number" ? M(e, t) : e)), Array.isArray(r.sourceColliderPathIds) && (r.sourceColliderPathIds = r.sourceColliderPathIds.map((e) => typeof e == "number" ? M(e, t) : e)), Array.isArray(r.colliders) && (r.colliders = r.colliders.map((e) => typeof e == "number" ? M(e, t) : e)), Array.isArray(r.selectedColliderIndexes) && (r.selectedColliderIndexes = r.selectedColliderIndexes.map((e) => typeof e == "number" ? M(e, t) : e)), Array.isArray(r.sphereColliderIndexes) && (r.sphereColliderIndexes = r.sphereColliderIndexes.map((e) => typeof e == "number" ? M(e, t) : e)), Array.isArray(r.capsuleColliderIndexes) && (r.capsuleColliderIndexes = r.capsuleColliderIndexes.map((e) => typeof e == "number" ? M(e, t) : e)), Array.isArray(r.panelColliderIndexes) && (r.panelColliderIndexes = r.panelColliderIndexes.map((e) => typeof e == "number" ? M(e, t) : e)), Array.isArray(r.springBonePathIds) && (r.springBonePathIds = r.springBonePathIds.map((e) => typeof e == "number" ? M(e, t) : e)), N(r.collidersByRoot) && (r.collidersByRoot = Re(r.collidersByRoot, t)), N(r.candidateRoots) && (r.candidateRoots = Re(r.candidateRoots, t)), r;
	}) : [];
}
function Le(e, t) {
	return e.map((e) => {
		if (!N(e)) return e;
		let n = {
			...e,
			runtimePartIndex: t
		};
		return typeof n.sourcePathId == "number" && (n.sourcePathId = M(n.sourcePathId, t)), typeof n.springManagerPathId == "number" && (n.springManagerPathId = M(n.springManagerPathId, t)), n;
	});
}
function M(e, t) {
	return (t + 1) * 1e9 + e;
}
function Re(e, t) {
	return Object.fromEntries(Object.entries(e).map(([e, n]) => [e, Array.isArray(n) ? n.map((e) => typeof e == "number" ? M(e, t) : e).filter((e) => typeof e == "number") : []]));
}
var ze = [
	[1, "CL_Hip"],
	[2, "CL_Chest"],
	[4, "CL_Left_Arm"],
	[8, "CL_Right_Arm"],
	[16, "CL_Left_Elbow"],
	[32, "CL_Right_Elbow"]
];
function Be(e) {
	return ze.filter(([t]) => (e & t) !== 0).map(([, e]) => e);
}
function Ve(e) {
	return e.flatMap((e) => e.partType === "body" ? [] : e.bones.filter((t) => (t.colliderFlag ?? 0) === 0 || typeof t.pathId != "number" ? !1 : !e.colliderBindings.some((e) => e.sourceSpringBonePathId === t.pathId && (e.sourceKind === "deferred_body_colliderFlag" || e.sourceKind === "colliderFlag"))).map((t) => ({
		sourceKind: "deferred_body_colliderFlag",
		partKind: t.partKind ?? e.partType,
		sourceSpringBonePathId: t.pathId,
		colliderFlag: t.colliderFlag,
		matchedPrefixes: Be(t.colliderFlag ?? 0),
		collidersByRoot: {},
		defaultRoot: "body",
		sourceColliderPathIds: [],
		colliders: [],
		rebindReason: "viewer_synthesized_missing_colliderFlag_binding"
	})));
}
function He(e) {
	let t = e.filter((e) => e.partType === "body").flatMap((e) => e.colliders), n = Xe(t);
	return Ve(e).map((e) => Ue(e, t)).concat(e.flatMap((e) => e.colliderBindings.map((r) => {
		if (r.sourceKind === "deferred_body_colliderFlag" && e.partType !== "body") return Ue(r, t);
		if (r.sourceKind !== "colliderFlag" || e.partType === "body" || !Ze(n)) return r;
		let i = Qe(n);
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
function Ue(e, t) {
	let n = We(e, t);
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
function We(e, t) {
	let n = ft(e.matchedPrefixes), r = Xe(t.filter((e) => typeof e.index == "number" && Ge(e, n))), i = Ze(r) ? Qe(r).root : et(e.defaultRoot ?? "body");
	return {
		byRoot: r,
		defaultRoot: i,
		indexes: r[i] ?? []
	};
}
function Ge(e, t) {
	if (!t.length) return !1;
	let n = j(e.nodeName);
	return t.some((e) => n.startsWith(e));
}
function Ke(e, t) {
	let n = new Map(e.filter((e) => typeof e.pathId == "number").map((e) => [e.pathId, e]));
	return t.filter((e) => typeof e.sourceSpringBonePathId == "number").map((e) => {
		let t = n.get(e.sourceSpringBonePathId), r = Ze(e.collidersByRoot) ? e.collidersByRoot : { [e.defaultRoot ?? t?.poseRoot ?? "unknown"]: e.colliders ?? [] };
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
function qe(e, t) {
	let n = new Map(e.flatMap((e) => e.colliders).filter((e) => typeof e.index == "number").map((e) => [e.index, e]));
	return e.flatMap((e) => e.managerColliderCaches.map((r) => e.partType === "head" || e.partType === "hair" ? Je(r, t, n) : Ye(r, n)));
}
function Je(e, t, n) {
	let r = new Set(pt(e.springBonePathIds)), i = ht(t.filter((e) => typeof e.sourceSpringBonePathId == "number" && r.has(e.sourceSpringBonePathId) && e.sourceKind === "colliderFlag").flatMap((e) => pt(e.colliders)).filter((e) => n.has(e)));
	return i.length ? {
		...e,
		sphereColliderIndexes: i.filter((e) => j(n.get(e)?.scriptName).includes("Sphere")),
		capsuleColliderIndexes: i.filter((e) => j(n.get(e)?.scriptName).includes("Capsule")),
		panelColliderIndexes: i.filter((e) => j(n.get(e)?.scriptName).includes("Panel")),
		reason: "viewer_composed_head_body_collider_cache"
	} : Ye(e, n);
}
function Ye(e, t) {
	return {
		...e,
		sphereColliderIndexes: pt(e.sphereColliderIndexes).filter((e) => t.has(e)),
		capsuleColliderIndexes: pt(e.capsuleColliderIndexes).filter((e) => t.has(e)),
		panelColliderIndexes: pt(e.panelColliderIndexes).filter((e) => t.has(e)),
		reason: "viewer_composed_active_parts_manager_cache"
	};
}
function Xe(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		if (typeof n.index != "number") continue;
		let e = et(tt(n.nodePath) ?? n.poseRoot ?? "body"), r = t.get(e) ?? [];
		r.push(n.index), t.set(e, r);
	}
	return Object.fromEntries([...t.entries()].map(([e, t]) => [e, [...new Set(t)].sort((e, t) => e - t)]));
}
function Ze(e) {
	return !!(e && Object.values(e).some((e) => e.length > 0));
}
function Qe(e) {
	let [t, n] = Object.entries(e).sort(([e], [t]) => $e(e) - $e(t) || e.localeCompare(t))[0];
	return {
		root: t,
		indexes: n
	};
}
function $e(e) {
	return e === "body" ? 0 : e === "sit_body" ? 1 : e === "guitar_body" ? 2 : 10;
}
function et(e) {
	return (e ?? "").trim() || "body";
}
function tt(e) {
	return e?.split("/").find(Boolean) ?? null;
}
function nt(e, t) {
	let n = [...t.warnings ?? []], r = [];
	for (let [i, a] of e.entries()) {
		let e = d(a.part);
		for (let o of P(a.nativeMeshes?.meshes)) {
			let a = rt(o, i);
			if (e !== "head_optional") {
				r.push(a);
				continue;
			}
			let s = j(a.rendererTransformPath), c = P(t.prefabGraphs).find((e) => lt(e.runtimePartIndex, -1) === i && !!j(e.headOptionalAttachPath)), l = j(c?.headOptionalPrefabRootPath);
			if (!c || !l) {
				n.push(`Head optional mesh '${j(o.meshPath) || j(o.meshName) || "<unnamed>"}' was skipped because the official prefab could not be mounted.`);
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
function rt(e, t) {
	let n = { ...e };
	for (let e of [
		"rendererPathId",
		"rendererTransformPathId",
		"rootBonePathId"
	]) typeof n[e] == "number" && (n[e] = M(n[e], t));
	return Array.isArray(n.bonePathIds) && (n.bonePathIds = n.bonePathIds.map((e) => typeof e == "number" ? M(e, t) : e)), n;
}
function it(e) {
	let t = [
		...e.filter((e) => d(e.part) === "head"),
		...e.filter((e) => d(e.part) === "hair"),
		...e.filter((e) => d(e.part) !== "head_optional")
	];
	for (let e of t) {
		let t = at(j(e.source?.bundlePath));
		if (t) return t;
		let n = at(j(e.part.modelAssetbundleName));
		if (n) return n;
	}
	return null;
}
function at(e) {
	let t = e.replace(/\\/g, "/").replace(/\.bundle$/i, "").match(/(?:^|\/)face\/([^/]+)\/([^/]+)$/i);
	return t ? `${t[1]}/${t[2]}` : null;
}
function ot(e, t) {
	if (!t) return null;
	let n = st(e)[t];
	return N(n) ? n : null;
}
function st(e) {
	return dt(e.mount?.accessoryTransformAdjustments);
}
function ct(e, t, n, r) {
	let i = dt(e);
	return {
		x: lt(i.x ?? i.X, t),
		y: lt(i.y ?? i.Y, n),
		z: lt(i.z ?? i.Z, r)
	};
}
function lt(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function ut(e) {
	return (e?.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? "") || null;
}
function N(e) {
	return !!(e && typeof e == "object" && !Array.isArray(e));
}
function dt(e) {
	return N(e) ? e : {};
}
function ft(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "string") : [];
}
function P(e) {
	return Array.isArray(e) ? e.filter((e) => N(e)) : [];
}
function pt(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "number") : [];
}
function mt(e) {
	return [...new Set(e)];
}
function ht(e) {
	return [...new Set(e)].sort((e, t) => e - t);
}
function gt(e) {
	let { runtime: t, role: n } = e;
	if (d(t.part) !== "head_optional") throw Error(`Part ${t.packagePath} is not a head_optional part.`);
	let r = "optional", i = Ne(t.springBone?.prefabGraph, 0), a = i?.transforms?.find((e) => e.parentPathId == null && j(e.transformPath) === r);
	if (!i || !a) throw Error(`Head optional part ${t.packagePath} has no official prefab root '${r}'.`);
	me(i, r), a.localPosition = {
		X: 0,
		Y: 0,
		Z: 0
	}, a.localRotation = {
		x: 0,
		y: 0,
		z: 0,
		w: 1
	}, i.headOptionalPrefabRootPath = r;
	let o = P(t.nativeMeshes?.meshes).map((e) => rt(e, 0)).filter((e) => he(j(e.rendererTransformPath), r));
	if (o.length === 0) throw Error(`Head optional part ${t.packagePath} has no renderer under '${r}'.`);
	let s = [...t.warnings ?? []], c = {
		version: "0414",
		prefabGraphs: [i],
		managers: [],
		bones: [],
		extraBones: [],
		colliders: [],
		colliderBindings: [],
		managerColliderCaches: [],
		bindingDecisions: [],
		constraintSetup: {
			version: "0414",
			sourceKind: "viewer_head_optional_part_runtime_package",
			constraints: [],
			warnings: []
		},
		warnings: s
	}, l = h(t.part.characterId, t.part.unit);
	return {
		id: `head_optional-${encodeURIComponent(l)}-${encodeURIComponent(t.packagePath ?? String(t.part.costume3dId))}`,
		displayName: t.part.name ?? `Head optional ${t.part.costume3dId}`,
		characterId: t.part.characterId,
		characterHeightMeters: n.characterHeightMeters,
		skinColors: n.skinColors,
		materialSlots: t.materialSlots ?? [],
		runtimeExtension: {
			characterControllers: {},
			nativeMeshes: {
				version: "0414",
				meshes: o,
				warnings: s
			},
			pjskSpringBone: {
				raw: {},
				runtimeUnitySetup: c
			}
		}
	};
}
//#endregion
//#region src/parts/customWardrobeController.ts
var _t = class {
	options;
	partSet = null;
	selection = null;
	activeRoleId = null;
	combined = null;
	constructor(e) {
		this.options = e;
	}
	loadPartPackageSet(e) {
		this.partSet = e, this.selection = null, this.activeRoleId = null, this.combined = null;
	}
	getPartPackageSet() {
		return this.partSet;
	}
	getCustomSelection() {
		return this.selection ? { ...this.selection } : null;
	}
	getActiveRoleId() {
		return this.activeRoleId;
	}
	selectRole(e, t) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		this.activeRoleId = h(e, t), this.selection && h(this.selection.characterId, this.selection.unit) !== this.activeRoleId && (this.selection = null, this.combined = null);
	}
	getCombinedCharacter() {
		return this.combined;
	}
	async setCustomSelection(e, t = () => !0) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		let n = this.resolveHeadSource(e);
		if (this.assertSameActiveCharacter(n), await this.ensureSelectionPackages(n), !t()) throw vt();
		this.activeRoleId ??= h(n.characterId, n.unit);
		let r = this.compose(n);
		return this.selection = { ...n }, this.combined = r, r;
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
		let t = h(e.characterId, e.unit);
		if (this.activeRoleId !== null && t !== this.activeRoleId) throw Error(`Custom switching is limited to active role ${this.activeRoleId}. Select/reload role ${t} before switching parts.`);
	}
	async ensureSelectionPackages(e) {
		if (!this.partSet || !this.options.loadPartRuntime) return;
		let t = x(this.partSet, e), n = [
			this.findRegistryEntry(e, "body", e.bodyCostume3dId),
			t,
			b(this.partSet, e),
			w(this.partSet, e)
		].filter((e) => e !== null && e.status !== "empty");
		await Promise.all(n.map(async (e) => {
			if (!this.partSet.packages.has(e.packagePath) && !await this.options.loadPartRuntime(e)) throw Error(`Failed to load ${e.partType} package ${e.packagePath}.`);
		}));
	}
	findRegistryEntry(e, t, n) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		let r = g(this.partSet, e.characterId, t, { unit: e.unit }).find((e) => e.costume3dId === n);
		if (!r) throw Error(`No ${t} registry entry for role ${h(e.characterId, e.unit)}, costume3dId ${n}.`);
		return r;
	}
	compose(e) {
		if (!this.partSet) throw Error("No custom part package set is loaded.");
		return _({
			partSet: this.partSet,
			selection: e,
			activeRoleId: this.activeRoleId ?? h(e.characterId, e.unit)
		});
	}
};
function vt() {
	let e = /* @__PURE__ */ Error("Custom part selection was superseded by a newer request.");
	return e.name = "AbortError", e;
}
//#endregion
//#region src/original/unityFile.ts
var yt = new TextDecoder("utf-8", { fatal: !0 });
function F(e, t) {
	if (!e) throw Error(t);
}
var bt = class {
	bytes;
	little;
	view;
	offset = 0;
	constructor(e, t = !1) {
		this.bytes = e, this.little = t, this.view = new DataView(e.buffer, e.byteOffset, e.byteLength);
	}
	ensure(e) {
		F(e >= 0 && this.offset + e <= this.bytes.length, "truncated Unity data");
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
		F(e >= 0, "unterminated Unity string");
		let t = yt.decode(this.bytes.subarray(this.offset, e));
		return this.offset = e + 1, t;
	}
	count(e = 2147483647) {
		let t = this.i32();
		return F(t >= 0 && t <= e, `invalid Unity array length ${t}`), t;
	}
};
function xt(e, t) {
	return F(e >= 0n && e <= BigInt(2 ** 53 - 1), `${t} out of range`), Number(e);
}
function St(e, t) {
	let n = new Uint8Array(t), r = 0, i = 0, a = e.length;
	for (; r < a;) {
		let o = e[r++], s = o >>> 4;
		if (s === 15) {
			let t;
			do
				t = e[r++], s += t;
			while (t === 255);
		}
		if (F(r + s <= a && i + s <= t, "LZ4 literal run out of range"), n.set(e.subarray(r, r + s), i), r += s, i += s, r >= a) break;
		let c = e[r] | e[r + 1] << 8;
		r += 2, F(c > 0 && c <= i, "invalid LZ4 match distance");
		let l = o & 15;
		if (l === 15) {
			let t;
			do
				t = e[r++], l += t;
			while (t === 255);
		}
		l += 4, F(i + l <= t, "LZ4 match out of range");
		let u = i - c;
		if (c >= l) n.copyWithin(i, u, u + l), i += l;
		else for (let e = 0; e < l; e++) n[i++] = n[u++];
	}
	return F(i === t, "LZ4 output size mismatch"), n;
}
function Ct(e, t, n) {
	let r = n & 63;
	return r === 0 ? (F(e.length === t, "uncompressed UnityFS block size mismatch"), e) : (F(r === 2 || r === 3, `unsupported UnityFS block compression ${r}`), St(e, t));
}
function wt(e) {
	let t = new bt(e);
	F(t.cstring() === "UnityFS", "not a UnityFS bundle");
	let n = t.u32();
	F(n === 8, `unsupported UnityFS version ${n}`);
	let r = t.cstring(), i = t.cstring();
	F(xt(t.i64(), "UnityFS size") === e.length, "UnityFS size mismatch");
	let a = t.u32(), o = t.u32(), s = t.u32();
	t.align(16);
	let c = t.offset, l = (s & 128) != 0, u = l ? e.length - a : c, d = new bt(Ct(e.subarray(u, u + a), o, s));
	d.take(16);
	let f = Array.from({ length: d.count(1 << 20) }, () => ({
		size: d.u32(),
		compressed: d.u32(),
		flags: d.u16()
	})), p = Array.from({ length: d.count(65536) }, () => ({
		offset: xt(d.i64(), "node offset"),
		size: xt(d.i64(), "node size"),
		flags: d.u32(),
		path: d.cstring()
	})), m = l ? c : u + a;
	s & 512 && (m = Math.ceil(m / 16) * 16);
	let h = f.reduce((e, t) => e + t.size, 0), g;
	if (f.every((e) => (e.flags & 63) == 0)) g = e.subarray(m, m + h), F(g.length === h, "truncated UnityFS data");
	else {
		g = new Uint8Array(h);
		let t = 0;
		for (let n of f) g.set(Ct(e.subarray(m, m + n.compressed), n.size, n.flags), t), m += n.compressed, t += n.size;
	}
	let _ = /* @__PURE__ */ new Map();
	for (let e of p) F(e.offset + e.size <= g.length && !_.has(e.path), `invalid UnityFS node ${e.path}`), _.set(e.path, {
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
var Tt = new TextEncoder().encode((/* @__PURE__ */ "AABB.AnimationClip.AnimationCurve.AnimationState.Array.Base.BitField.bitset.bool.char.ColorRGBA.Component.data.deque.double.dynamic_array.FastPropertyName.first.float.Font.GameObject.Generic Mono.GradientNEW.GUID.GUIStyle.int.list.long long.map.Matrix4x4f.MdFour.MonoBehaviour.MonoScript.m_ByteSize.m_Curve.m_EditorClassIdentifier.m_EditorHideFlags.m_Enabled.m_ExtensionPtr.m_GameObject.m_Index.m_IsArray.m_IsStatic.m_MetaFlag.m_Name.m_ObjectHideFlags.m_PrefabInternal.m_PrefabParentObject.m_Script.m_StaticEditorFlags.m_Type.m_Version.Object.pair.PPtr<Component>.PPtr<GameObject>.PPtr<Material>.PPtr<MonoBehaviour>.PPtr<MonoScript>.PPtr<Object>.PPtr<Prefab>.PPtr<Sprite>.PPtr<TextAsset>.PPtr<Texture>.PPtr<Texture2D>.PPtr<Transform>.Prefab.Quaternionf.Rectf.RectInt.RectOffset.second.set.short.size.SInt16.SInt32.SInt64.SInt8.staticvector.string.TextAsset.TextMesh.Texture.Texture2D.Transform.TypelessData.UInt16.UInt32.UInt64.UInt8.unsigned int.unsigned long long.unsigned short.vector.Vector2f.Vector3f.Vector4f.m_ScriptingClassIdentifier.Gradient.Type*.int2_storage.int3_storage.BoundsInt.m_CorrespondingSourceObject.m_PrefabInstance.m_PrefabAsset.FileSize.Hash128.RenderingLayerMask.fixed_array.EntityId.".split(".")).join("\0")), Et = 16384;
function Dt(e, t) {
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
var Ot = (() => {
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
		array: Dt(Uint16Array, (e, t, n) => e.getUint16(t, n))
	}, i = {
		size: 2,
		read: (e) => e.i16(),
		array: Dt(Int16Array, (e, t, n) => e.getInt16(t, n))
	}, a = {
		size: 4,
		read: (e) => e.u32(),
		array: Dt(Uint32Array, (e, t, n) => e.getUint32(t, n))
	}, o = {
		size: 4,
		read: (e) => e.i32(),
		array: Dt(Int32Array, (e, t, n) => e.getInt32(t, n))
	}, s = {
		size: 4,
		read: (e) => e.f32(),
		array: Dt(Float32Array, (e, t, n) => e.getFloat32(t, n))
	}, c = {
		size: 8,
		read: (e) => e.f64(),
		array: Dt(Float64Array, (e, t, n) => e.getFloat64(t, n))
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
function kt(e) {
	let t = (e.metaFlags & Et) !== 0, n = (e, t) => t ? (t) => {
		let n = e(t);
		return t.align(), n;
	} : e, r = Ot[e.type];
	if (r && e.children.length === 0) return n(r.read, t);
	if (e.type === "string") return (e) => {
		let t = e.count(), n = yt.decode(e.take(t));
		return e.align(), n;
	};
	if (e.type === "TypelessData") return n((e) => e.take(e.count()), t);
	let i = e.children[0];
	if (i && i.type === "Array") {
		F(i.children.length === 2, `invalid TypeTree array ${e.name}`);
		let r = i.children[1], a = t || (i.metaFlags & Et) !== 0, o = Ot[r.type];
		if (o && r.children.length === 0 && (r.metaFlags & Et) === 0) return n((e) => {
			let t = e.count(), n = e.take(t * o.size);
			return o.array(n, t, e.little);
		}, a);
		let s = kt(r);
		return n((e) => {
			let t = e.count();
			r.byteSize > 0 && e.ensure(t * r.byteSize);
			let n = Array(t);
			for (let r = 0; r < t; r++) n[r] = s(e);
			return n;
		}, a);
	}
	F(e.children.length > 0, `unsupported TypeTree leaf ${e.type} ${e.name}`);
	let a = e.children.map((e) => [e.name, kt(e)]);
	return n((e) => {
		let t = {};
		for (let [n, r] of a) t[n] = r(e);
		return t;
	}, t);
}
function At(e) {
	let t = e.count(1 << 20), n = e.count(1 << 26);
	F(t > 0, "missing embedded TypeTree");
	let r = Array(t);
	for (let n = 0; n < t; n++) {
		e.u16();
		let t = e.u8();
		e.u8();
		let i = e.u32(), a = e.u32(), o = e.i32();
		e.i32();
		let s = e.i32();
		F(e.u64() === 0n, "managed-reference TypeTrees are not supported"), r[n] = {
			level: t,
			typeOffset: i,
			nameOffset: a,
			byteSize: o,
			metaFlags: s
		};
	}
	let i = e.take(n), a = (e) => {
		let t = (e & 2147483648) == 0, n = t ? i : Tt, r = t ? e : e & 2147483647, a = n.indexOf(0, r);
		return yt.decode(n.subarray(r, a < 0 ? n.length : a));
	}, o = [], s = null;
	for (let e of r) {
		let t = {
			type: a(e.typeOffset),
			name: a(e.nameOffset),
			byteSize: e.byteSize,
			metaFlags: e.metaFlags,
			children: []
		};
		F(e.level <= o.length, "invalid TypeTree nesting"), o.length = e.level, e.level === 0 ? s = t : o[e.level - 1].children.push(t), o.push(t);
	}
	return s;
}
function jt(e) {
	let t = new bt(e);
	t.u32(), t.u32();
	let n = t.u32();
	t.u32(), F(n === 22, `unsupported SerializedFile version ${n}`);
	let r = t.u8();
	t.take(3);
	let i = t.u32(), a = xt(t.i64(), "file size"), o = xt(t.i64(), "data offset");
	t.i64(), F(a === e.length, "SerializedFile size mismatch"), t.little = r === 0;
	let s = t.cstring(), c = t.i32();
	F(t.u8() === 1, "SerializedFile without TypeTrees");
	let l = [];
	for (let e = t.count(65536); e > 0; e--) {
		let e = t.i32();
		t.u8();
		let n = t.i16();
		e === 114 && t.take(16), t.take(16);
		let r = At(t);
		t.take(t.count(1 << 20) * 4), l.push({
			classId: e,
			typeName: r.type,
			scriptTypeIndex: n,
			read: kt(r)
		});
	}
	let u = /* @__PURE__ */ new Map(), d = t.little;
	for (let n = t.count(1 << 24); n > 0; n--) {
		t.align();
		let n = t.i64(), r = xt(t.i64(), "object offset") + o, i = t.u32(), s = l[t.i32()];
		F(s && r + i <= a && !u.has(n), `invalid object entry ${n}`);
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
					let t = new bt(e.subarray(r, r + i), d);
					c = s.read(t), F(t.offset === i, `object ${n} (class ${s.classId}): ${i - t.offset} bytes unread`);
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
	return F(t.count(65536) === 0, "SerializedFile reference types are not supported"), t.cstring(), F(t.offset === 48 + i, "SerializedFile metadata size mismatch"), {
		unityVersion: s,
		targetPlatform: c,
		objects: u,
		externals: f
	};
}
//#endregion
//#region src/original/unityBundle.ts
var Mt = /* @__PURE__ */ function(e) {
	return e[e.GameObject = 1] = "GameObject", e[e.Transform = 4] = "Transform", e[e.Material = 21] = "Material", e[e.MeshRenderer = 23] = "MeshRenderer", e[e.Texture2D = 28] = "Texture2D", e[e.MeshFilter = 33] = "MeshFilter", e[e.Mesh = 43] = "Mesh", e[e.Shader = 48] = "Shader", e[e.AnimationClip = 74] = "AnimationClip", e[e.Animator = 95] = "Animator", e[e.MonoBehaviour = 114] = "MonoBehaviour", e[e.MonoScript = 115] = "MonoScript", e[e.SkinnedMeshRenderer = 137] = "SkinnedMeshRenderer", e[e.AssetBundle = 142] = "AssetBundle", e;
}({});
function Nt(e, t) {
	if (!e) throw Error(t);
}
var Pt = class {
	name;
	serialized;
	streams = /* @__PURE__ */ new Map();
	pathCache = /* @__PURE__ */ new Map();
	assetBundle;
	cabName;
	size;
	constructor(e, t) {
		this.name = e;
		let n = wt(t);
		this.size = [...n.nodes.values()].reduce((e, t) => e + t.bytes.length, 0);
		let r = null, i = "";
		for (let t of n.nodes.values()) t.flags & 4 ? (Nt(!r, `${e}: more than one SerializedFile`), r = jt(t.bytes), i = t.path) : this.streams.set(t.path, t.bytes);
		Nt(r, `${e}: no SerializedFile`), this.serialized = r, this.cabName = i;
		let a = [...r.objects.values()].find((e) => e.classId === 142);
		Nt(a, `${e}: no AssetBundle object`), this.assetBundle = a.read();
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
		return Nt(i, `${this.name}: stream ${e} not in bundle`), Nt(t + n <= i.length, `${this.name}: stream range ${t}+${n} exceeds ${r}`), i.subarray(t, t + n);
	}
	resource(e, t) {
		let n = this.assetBundle.m_Container.filter((n) => {
			let r = this.local(n.second.asset);
			if (!r || r.classId !== 1 || r.read().m_Name.toLowerCase() !== e.toLowerCase()) return !1;
			let i = n.first.replace(/\\/g, "/"), a = /\/(fbx|sourceimages)\//i.test(i);
			return i.toLowerCase().endsWith(t.toLowerCase()) && !a;
		});
		Nt(n.length === 1, `${this.name}: resource ${e} matches ${n.length} container entries ending in ${t}`);
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
function Ft(e, t) {
	if (!e) throw Error(t);
}
var It = {
	48: 4,
	49: 5,
	50: 6,
	51: 8,
	52: 10,
	53: 12
}, Lt = {
	4: e.RGBA_ASTC_4x4_Format,
	5: e.RGBA_ASTC_5x5_Format,
	6: e.RGBA_ASTC_6x6_Format,
	8: e.RGBA_ASTC_8x8_Format,
	10: e.RGBA_ASTC_10x10_Format,
	12: e.RGBA_ASTC_12x12_Format
}, Rt = 7, zt = null;
async function Bt(e) {
	return zt ||= (async () => {
		let t = e ?? await (await fetch("data:application/wasm;base64,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IBNBCGohEyAIQQhqIQggA0EIaiEDIA9BBGohDyABQQhqIQEgBUEBaiIFIA0oAgQgDSgCAGxIDQALDAELIA0oAgQgDSgCAGwhACANKAIQQQFMBEAgAEEATA0BQQAhDwNAIAEgAmogDSgCPCANKAJMIAIgDWpBvAFqIgAoAgAgDSgCJEECdEHgtghqKAIAEQAArSANKAJAIA0oAlAgACgCACANKAIkQQJ0QeC2CGooAgARAACtQhCGhCANKAJEIA0oAlQgACgCACANKAIkQQJ0QeC2CGooAgARAACtQiCGhCANKAJIIA0oAlggACgCACANKAIkQQJ0QaC3CGooAgARAACtQjCGhDcDACACQQhqIQIgD0EBaiIPIA0oAgQgDSgCAGxIDQALDAELIABBAEwNACANQTxqIQUgDUEkaiECQbwKIRMDQCABIANqIAUgDSATaigCACIAQQV0aiIHKAIAIAcoAhAgAyANakG8AWoiBigCACACIABBAnRqIgAoAgBBAnRB4LYIaigCABEAAK0gBygCBCAHKAIUIAYoAgAgACgCAEECdEHgtghqKAIAEQAArUIQhoQgBygCCCAHKAIYIAYoAgAgACgCAEECdEHgtghqKAIAEQAArUIghoQgBygCDCAHKAIcIAYoAgAgACgCAEECdEGgtwhqKAIAEQAArUIwhoQ3AwAgE0EEaiETIANBCGohAyAIQQFqIgggDSgCBCANKAIAbEgNAAsLIAlBEGokAAwBCyAdQQBMDQBBACEBICdFBEAgBCEAA0AgAEL//4OAcDcDACAAQThqQv//g4BwNwMAIABBMGpC//+DgHA3AwAgAEEoakL//4OAcDcDACAAQSBqQv//g4BwNwMAIABBGGpC//+DgHA3AwAgAEEQakL//4OAcDcDACAAQQhqQv//g4BwNwMAIABBQGshACAmIAFBCGoiAUcNAAsLIB5FDQAgBCABQQN0aiEAIB4hAQNAIABC//+DgHA3AwAgAEEIaiEAIAFBAWsiAQ0ACwsCQCAbQQBMIgANACAADQBBACEGIAQhAyAjIQIDQCAiIQAgAyEBIAIhCCAbIQUgBiAvaiArTg0BA0AgACAqSARAIAggASkDADcDACAAQQFqIQAgAUEIaiEBIAhBCGohCCAFQQFrIgUNAQsLIAMgJWohAyACIC1qIQIgBkEBaiIGIBtHDQALCyAbICJqISIgIyAlaiEjIA5BEGohDiAoQQFqIiggJEcNAAsgICAuaiEgICFBAWoiISAsRw0AC0HgwAgtAABBf3NBAXELIARBgBhqJAALC4o2WQBBhIAICwUBAAAAAgBBlIAICzUBAAAAAgAAAAEAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgBB1IAICyUBAAAAAgAAAAEAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEGEgQgLBQEAAAACAEGUgQgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEHUgQgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAABAAAAAAAAAAEAAAACAEGUgggLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEHUgggLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEGUgwgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEHUgwgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEGUhAgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEHUhAgLJQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQYSFCAsFAQAAAAIAQZSFCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQdSFCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAEAAAAAAAAAAQAAAAIAQZSGCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQdSGCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQZSHCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQdSHCAspAQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAQZCICAspAQAAAAEAAAABAAAAAAAAAAIAAAACAAAAAgAAAAAAAAACAAAAAgAAAAIAQcyICAshAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAABAEGQiQgLKQEAAAABAAAAAQAAAAAAAAACAAAAAgAAAAIAAAAAAAAAAgAAAAIAAAACAEHMiQgLLQEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAQBBkIoICykBAAAAAQAAAAEAAAAAAAAAAgAAAAIAAAACAAAAAAAAAAIAAAACAAAAAgBBzIoICy0BAAAAAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAgAAAAEAAAACAAAAAgAAAAIAQZCLCAspAQAAAAEAAAABAAAAAAAAAAIAAAACAAAAAgAAAAAAAAACAAAAAgAAAAIAQcyLCAstAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAABAAAAAgAAAAIAAAACAEGQjAgLKQEAAAABAAAAAQAAAAAAAAACAAAAAgAAAAIAAAAAAAAAAgAAAAIAAAACAEHMjAgLIQEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAQBB/IwICwEBAEGQjQgLKQEAAAABAAAAAQAAAAAAAAACAAAAAgAAAAIAAAAAAAAAAgAAAAIAAAACAEHMjQgLMQEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAQAAAAEAQZCOCAspAQAAAAEAAAABAAAAAAAAAAIAAAACAAAAAgAAAAAAAAACAAAAAgAAAAIAQcyOCAsxAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAABAAAAAgAAAAIAAAACAAAAAQBBkI8ICykBAAAAAQAAAAEAAAAAAAAAAgAAAAIAAAACAAAAAAAAAAIAAAACAAAAAgBBzI8ICzEBAAAAAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAgAAAAEAAAACAAAAAgAAAAIAAAABAEGMkAgLAQIAQZyQCAsBAgBBrJAIC0ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgBB/JAICwECAEGMkQgLAQIAQZyRCAsBAgBBrJEIC0ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgBB/JEICwECAEGMkggLAQIAQZySCAsBAgBBrJIIC0ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgBB/JIICwECAEGMkwgLAQIAQZyTCAsBAgBBrJMIC1ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAgAAAAIAQYyUCAsBAgBBnJQICwECAEGslAgLUQIAAAACAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgBBjJUICwECAEGclQgLAQIAQayVCAtRAgAAAAIAAAACAAAAAgAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAEGMlggLAQIAQZyWCAsBAgBBrJYIC1ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgAAAAEAAAABAAAAAQAAAAIAQYyXCAsBAgBBnJcICwECAEGslwgLUQIAAAACAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgBB8JgIC40CAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAQfCbCAsNAgAAAAIAAAACAAAAAgBB8JwIC40DAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAgBB8KAICw0CAAAAAgAAAAIAAAACAEHwoQgLDQIAAAACAAAAAgAAAAIAQfCiCAupBgIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAgAAAAIAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAAAAAAEAAAACAAAAAwAAAAQAAAAAAAAABAAAAAQAAAAAAAAAAQAAAAIAAAADAAAABAAAAAEAAAAEAAAABAAAAAAAAAABAAAAAgAAAAMAAAAEAAAAAgAAAAQAAAAEAAAAAAAAAAEAAAACAAAAAwAAAAQAAAADAAAABAAAAAQAAAAAAAAAAQAAAAIAAAADAAAABAAAAAAAAAAEAEGkqQgL7QEBAAAAAgAAAAMAAAAEAAAAAQAAAAQAAAABAAAAAAAAAAEAAAACAAAAAwAAAAQAAAACAAAABAAAAAIAAAAAAAAAAQAAAAIAAAADAAAABAAAAAMAAAAEAAAAAwAAAAAAAAABAAAAAgAAAAMAAAAEAAAAAAAAAAIAAAADAAAAAAAAAAEAAAACAAAAAwAAAAQAAAABAAAAAgAAAAMAAAAAAAAAAQAAAAIAAAADAAAABAAAAAIAAAACAAAAAwAAAAAAAAABAAAAAgAAAAMAAAAEAAAAAwAAAAIAAAADAAAAAAAAAAEAAAACAAAAAwAAAAQAQZyrCAthAQAAAAAAAAABAAAAAgAAAAMAAAAEAAAAAQAAAAAAAAABAAAAAAAAAAEAAAACAAAAAwAAAAQAAAACAAAAAAAAAAEAAAAAAAAAAQAAAAIAAAADAAAABAAAAAMAAAAAAAAAAQBBlKwIC2kEAAAABAAAAAQAAAABAAAAAQAAAAEAAAABAAAAAQAAAAQAAAAEAAAABAAAAAIAAAACAAAAAgAAAAIAAAACAAAABAAAAAQAAAAEAAAAAwAAAAMAAAADAAAAAwAAAAMAAAAEAAAABAAAAAQAQZStCAtpBAAAAAAAAAAEAAAAAQAAAAEAAAABAAAAAQAAAAEAAAAEAAAAAQAAAAQAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAACAAAABAAAAAMAAAADAAAAAwAAAAMAAAADAAAABAAAAAMAAAAEAEGUrggLAQQAQaCuCAtdAQAAAAEAAAABAAAAAQAAAAEAAAAEAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAACAAAAAgAAAAMAAAADAAAAAwAAAAMAAAADAAAABAAAAAMAAAADAEGUrwgLAQQAQaCvCAtdAQAAAAEAAAABAAAAAQAAAAEAAAAEAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAACAAAAAgAAAAMAAAADAAAAAwAAAAMAAAADAAAABAAAAAMAAAADAEGcsAgLAQQAQbiwCAsFAQAAAAQAQdiwCAsFAgAAAAQAQfiwCAuFAwMAAAAEAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAABAAAAAQAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAAEAAAABAAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAQAAAAEAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAABAAAAAQAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAAEAAAABAAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAAEAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAABAAAAAQAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAAEAAAABAAAAAMAAAADAAAAAwAAAAMAAAADAAAAAwAAAAQAAAAEAAAAAwAAAAMAAAADAAAAAwAAAAMAAAADAAAABAAAAAQAAAADAAAAAwAAAAMAAAADAAAAAwAAAAMAAAAEAAAABAAAAAMAAAADAAAAAwAAAAMA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")).arrayBuffer(), { instance: n } = await WebAssembly.instantiate(t, {}), r = n.exports;
		return { decode16(e, t, n, i) {
			let a = r.__heap_base.value, o = Math.ceil(a / 16) * 16, s = Math.ceil((o + e.length) / 16) * 16, c = s + t * n * 8;
			return c > r.memory.buffer.byteLength && r.memory.grow(Math.ceil((c - r.memory.buffer.byteLength) / 65536)), new Uint8Array(r.memory.buffer).set(e, o), Ft(r.decode_rgba16(o, t, n, i, s) === 1, "ASTC decode failed (invalid or HDR block)"), new Uint16Array(r.memory.buffer, s, t * n * 4).slice();
		} };
	})(), zt;
}
function Vt(e, t) {
	let n = e.object(t);
	Ft(n && n.classId === Mt.Texture2D, `${e.name}: ${t} is not a Texture2D`);
	let r = n.read();
	Ft(r.m_MipCount === 1, `${r.m_Name}: ${r.m_MipCount} mip levels (only single-level textures are expected)`);
	let i = r.m_StreamData.path ? e.stream(r.m_StreamData.path, Number(r.m_StreamData.offset), r.m_StreamData.size) : r["image data"];
	return Ft(It[r.m_TextureFormat] || r.m_TextureFormat === Rt, `${r.m_Name}: texture format ${r.m_TextureFormat} is not supported`), {
		name: r.m_Name,
		width: r.m_Width,
		height: r.m_Height,
		format: r.m_TextureFormat,
		data: i.slice()
	};
}
function Ht(e) {
	if (e === 65535) return 15360;
	if (e < 4) return e << 8;
	let t = Math.clz32(e) - 16;
	return (e * 2 ** (t + 1) & 65535) >> 6 | 14 - t << 10;
}
async function Ut(t, n) {
	let { width: r, height: i, data: a } = t, o = It[t.format], s;
	if (o) if (n.nativeAstc) s = new e.CompressedTexture([{
		data: a,
		width: r,
		height: i
	}], r, i, Lt[o]);
	else {
		let t = (await Bt()).decode16(a, r, i, o);
		for (let e = 0; e < t.length; e++) t[e] = Ht(t[e]);
		s = new e.DataTexture(t, r, i, e.RGBAFormat, e.HalfFloatType);
	}
	else {
		Ft(a.length === r * i * 2, `${t.name}: RGB565 size mismatch`);
		let n = new Uint16Array(a.buffer, a.byteOffset, r * i), o = new Uint16Array(n.length * 4);
		for (let t = 0; t < n.length; t++) {
			let r = n[t];
			o[t * 4] = e.DataUtils.toHalfFloat((r >> 11 & 31) / 31), o[t * 4 + 1] = e.DataUtils.toHalfFloat((r >> 5 & 63) / 63), o[t * 4 + 2] = e.DataUtils.toHalfFloat((r & 31) / 31), o[t * 4 + 3] = e.DataUtils.toHalfFloat(1);
		}
		s = new e.DataTexture(o, r, i, e.RGBAFormat, e.HalfFloatType);
	}
	return s.name = t.name, s.flipY = !1, s.generateMipmaps = !1, s.colorSpace = e.NoColorSpace, s.needsUpdate = !0, s;
}
async function Wt(e) {
	let { width: t, height: n, data: r } = e, i = It[e.format], a = new Uint8Array(t * n * 4);
	if (i) {
		let e = (await Bt()).decode16(r, t, n, i);
		for (let t = 0; t < a.length; t++) a[t] = e[t] >> 8;
		return a;
	}
	let o = new Uint16Array(r.buffer, r.byteOffset, t * n);
	for (let e = 0; e < o.length; e++) {
		let t = o[e];
		a[e * 4] = Math.round((t >> 11 & 31) * 255 / 31), a[e * 4 + 1] = Math.round((t >> 5 & 63) * 255 / 63), a[e * 4 + 2] = Math.round((t & 31) * 255 / 31), a[e * 4 + 3] = 255;
	}
	return a;
}
var Gt = class {
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
		return this.payloads.has(e) || this.textures.has(e);
	}
	payload(e) {
		return this.payloads.get(e) ?? null;
	}
	define(e, t) {
		this.textures.has(e) || this.textures.set(e, t());
	}
	loadAsync(e) {
		let t = this.textures.get(e);
		if (!t) {
			let n = this.payloads.get(e);
			Ft(n, `original texture ${e} was not delivered with its part`), t = Ut(n, this.caps), this.textures.set(e, t);
		}
		return t;
	}
	dispose() {
		for (let e of this.textures.values()) e.then((e) => e.dispose());
		this.textures.clear(), this.payloads.clear();
	}
}, Kt = null;
function qt(e) {
	return Kt ??= new Gt(e ?? { nativeAstc: !1 }), Kt;
}
function Jt(e) {
	return { nativeAstc: e.extensions.has("WEBGL_compressed_texture_astc") };
}
//#endregion
//#region src/original/hairRecolor.ts
function Yt(e, t, n, r, i) {
	let a = (e) => {
		let t = e / 255;
		return t <= .04045 ? t / 12.92 : ((t + .055) / 1.055) ** 2.4;
	}, o = a(e), s = a(t), c = a(n), l = (.4124 * o + .3576 * s + .1805 * c) / .95047, u = .2126 * o + .7152 * s + .0722 * c, d = (.0193 * o + .1192 * s + .9505 * c) / 1.08883, f = (e) => e > .008856 ? Math.cbrt(e) : 7.787 * e + 16 / 116, p = f(l), m = f(u), h = f(d);
	r[i] = 116 * m - 16, r[i + 1] = 500 * (p - m), r[i + 2] = 200 * (m - h);
}
function Xt(e, t, n, r, i) {
	let a = (e + 16) / 116, o = a + t / 500, s = a - n / 200, c = (e) => e ** 3 > .008856 ? e ** 3 : (e - 16 / 116) / 7.787, l = c(o) * .95047, u = c(a), d = c(s) * 1.08883, f = (e) => {
		let t = e <= .0031308 ? 12.92 * e : 1.055 * Math.max(e, 0) ** (1 / 2.4) - .055;
		return Math.max(0, Math.min(255, Math.round(t * 255)));
	};
	r[i] = f(3.2406 * l - 1.5372 * u - .4986 * d), r[i + 1] = f(-.9689 * l + 1.8758 * u + .0415 * d), r[i + 2] = f(.0557 * l - .204 * u + 1.057 * d);
}
function Zt(e, t, n, r, i = new Uint8Array(e * t)) {
	for (let a = 0; a + 2 < r.length; a += 3) {
		let o = n[r[a] * 2] * e, s = n[r[a] * 2 + 1] * t, c = n[r[a + 1] * 2] * e, l = n[r[a + 1] * 2 + 1] * t, u = n[r[a + 2] * 2] * e, d = n[r[a + 2] * 2 + 1] * t, f = (c - o) * (d - s) - (l - s) * (u - o);
		if (f === 0) continue;
		let p = Math.max(0, Math.floor(Math.min(o, c, u))), m = Math.min(e - 1, Math.ceil(Math.max(o, c, u))), h = Math.max(0, Math.floor(Math.min(s, l, d))), g = Math.min(t - 1, Math.ceil(Math.max(s, l, d)));
		for (let t = h; t <= g; t++) for (let n = p; n <= m; n++) {
			let r = n + .5, a = t + .5, p = ((c - r) * (d - a) - (l - a) * (u - r)) / f, m = ((u - r) * (s - a) - (d - a) * (o - r)) / f;
			p >= 0 && m >= 0 && p + m <= 1 && (i[t * e + n] = 1);
		}
	}
	return i;
}
function Qt(e, t) {
	let n = 0;
	for (let e = 0; e < t.length; e++) t[e] && n++;
	let r = new Float32Array(n * 3), i = 0;
	for (let n = 0; n < t.length; n++) t[n] && Yt(e.data[n * 4], e.data[n * 4 + 1], e.data[n * 4 + 2], r, 3 * i++);
	return r;
}
function $t(e) {
	let t = e.length / 3, n = new Float32Array(t);
	for (let r = 0; r < t; r++) n[r] = e[r * 3];
	n.sort();
	let r = n[Math.floor(t * .2)], i = n[Math.min(t - 1, Math.floor(t * .8))], a = (r + i) / 2;
	for (let e = 0; e < 30; e++) {
		let e = 0, o = 0, s = 0, c = 0;
		for (let r = 0; r < t; r++) n[r] < a ? (e += n[r], o++) : (s += n[r], c++);
		o && (r = e / o), c && (i = s / c);
		let l = (r + i) / 2;
		if (Math.abs(l - a) < .001) break;
		a = l;
	}
	return a;
}
function en(e, t, n) {
	let r = [];
	for (let n = 0; n < e.length; n += 3) t(e[n]) && r.push(e[n]);
	if (r.length === 0) throw Error("a hair tone covers no texel");
	r.sort((e, t) => e - t);
	let i = r[Math.min(r.length - 1, Math.floor(n / 100 * r.length))];
	for (let n of [2, Infinity]) {
		let r = 0, a = 0, o = 0;
		for (let s = 0; s < e.length; s += 3) t(e[s]) && Math.abs(e[s] - i) <= n && (r += e[s + 1], a += e[s + 2], o++);
		if (o) return {
			L: i,
			a: r / o,
			b: a / o
		};
	}
	throw Error("unreachable");
}
function tn(e) {
	let t = $t(e);
	return {
		dark: en(e, (e) => e < t, 50),
		main: en(e, (e) => e >= t, 50),
		high: en(e, (e) => e >= t, 99)
	};
}
function nn(e, t) {
	let n = Qt(e, t);
	if (n.length === 0) throw Error("the hair covers no texel");
	let r = $t(n), i = en(n, (e) => e >= r, 50), a = [];
	for (let e = 0; e < n.length; e += 3) {
		let t = n[e + 1], r = n[e + 2];
		(Math.hypot(t, r) <= 12 || Math.hypot(t - i.a, r - i.b) <= 35) && a.push(e);
	}
	if (a.length * 3 >= n.length * .5 && a.length * 3 < n.length) {
		let e = new Float32Array(a.length * 3);
		a.forEach((t, r) => e.set(n.subarray(t, t + 3), r * 3)), n = e;
	}
	return tn(n);
}
var rn = .12, an = 12;
function on(e, t) {
	let n = Qt(e, t), r = n.length / 3;
	if (r === 0) throw Error("the hair covers no texel");
	let i = 0, a = 0;
	for (let e = 0; e < r; e++) i += n[e * 3 + 1], a += n[e * 3 + 2];
	i /= r, a /= r;
	let o = 0, s = 0, c = 0;
	for (let e = 0; e < r; e++) {
		let t = n[e * 3 + 1] - i, r = n[e * 3 + 2] - a;
		o += t * t, s += t * r, c += r * r;
	}
	let l = .5 * Math.atan2(2 * s, o - c), u = Math.cos(l), d = Math.sin(l), f = Float32Array.from({ length: r }, (e, t) => (n[t * 3 + 1] - i) * u + (n[t * 3 + 2] - a) * d), p = f.slice().sort(), m = p[Math.floor(r * .2)], h = p[Math.floor(r * .8)], g = [[0, 0], [0, 0]], _ = new Uint8Array(r);
	for (let e = 0; e < r; e++) _[e] = +(f[e] >= (m + h) / 2);
	for (let e = 0; e < 30; e++) {
		let e = [[
			0,
			0,
			0
		], [
			0,
			0,
			0
		]];
		for (let t = 0; t < r; t++) {
			let r = e[_[t]];
			r[0] += n[t * 3 + 1], r[1] += n[t * 3 + 2], r[2]++;
		}
		for (let t of [0, 1]) e[t][2] && (g[t] = [e[t][0] / e[t][2], e[t][1] / e[t][2]]);
		let t = 0;
		for (let e = 0; e < r; e++) {
			let r = n[e * 3 + 1], i = n[e * 3 + 2], a = Math.hypot(r - g[0][0], i - g[0][1]) <= Math.hypot(r - g[1][0], i - g[1][1]) ? 0 : 1;
			a !== _[e] && (_[e] = a, t++);
		}
		if (!t) break;
	}
	let v = 0;
	for (let e = 0; e < r; e++) v += _[e];
	let y = Math.min(v, r - v) / r, b = Math.hypot(g[0][0] - g[1][0], g[0][1] - g[1][1]);
	return y < rn || b < an ? {
		groups: [{
			a: i,
			b: a,
			tones: tn(n)
		}],
		sigma: 1
	} : {
		groups: [0, 1].map((e) => {
			let t = new Float32Array((e ? v : r - v) * 3), i = 0;
			for (let a = 0; a < r; a++) _[a] === e && t.set(n.subarray(a * 3, a * 3 + 3), 3 * i++);
			return {
				a: g[e][0],
				b: g[e][1],
				tones: tn(t)
			};
		}),
		sigma: .3 * b
	};
}
var sn = (e, t, n) => e + (t - e) * n, cn = 1.5;
function ln(e, t, n, r) {
	let i = [
		n.dark,
		n.main,
		n.high
	], a = [
		t.dark.L,
		t.main.L,
		t.high.L
	];
	a[0] = Math.min(a[0], a[1] - .5), a[2] = Math.max(a[2], a[1] + .5);
	let o = [
		n.main.L - Math.min(Math.max(.5, n.main.L - n.dark.L), (a[1] - a[0]) * cn),
		n.main.L,
		n.main.L + Math.min(Math.max(.5, n.high.L - n.main.L), (a[2] - a[1]) * cn)
	];
	if (e <= a[0]) {
		let t = Math.min(1.6, Math.max(.4, (o[1] - o[0]) / (a[1] - a[0])));
		r[0] = o[0] + (e - a[0]) * t, r[1] = i[0].a, r[2] = i[0].b;
	} else if (e >= a[2]) r[0] = o[2] + (e - a[2]), r[1] = i[2].a, r[2] = i[2].b;
	else {
		let t = e < a[1] ? 0 : 1, n = (e - a[t]) / (a[t + 1] - a[t]);
		r[0] = sn(o[t], o[t + 1], n), r[1] = sn(i[t].a, i[t + 1].a, n), r[2] = sn(i[t].b, i[t + 1].b, n);
	}
}
var un = 5, dn = 8, fn = 10;
function pn(e, t) {
	let n = Qt(e, t), r = n.length / 3;
	if (r === 0) return null;
	let i = (e) => Float32Array.from({ length: r }, (t, r) => n[r * 3 + e]).sort()[r >> 1];
	return {
		L: i(0),
		a: i(1),
		b: i(2)
	};
}
function mn(e, t, n, r = null) {
	let i = "groups" in t ? t.groups : [{
		a: 0,
		b: 0,
		tones: t
	}], a = "groups" in t ? t.sigma : 1, o = e.data.slice(), { width: s, height: c } = e, l = (e, t) => Math.hypot(e.L - t.L, e.a - t.a, e.b - t.b) < fn, u = r && !i.some((e) => [
		e.tones.dark,
		e.tones.main,
		e.tones.high
	].some((e) => l(e, r.from))) ? r : null, d = new Float32Array(s * c * 3);
	for (let t = 0; t < s * c; t++) Yt(e.data[t * 4], e.data[t * 4 + 1], e.data[t * 4 + 2], d, t * 3);
	let f = new Float32Array(s * c);
	for (let e = 0; e < c; e++) for (let t = 0; t < s; t++) {
		let n = d[(e * s + t) * 3], r = 0, i = 0;
		for (let a = -2; a <= 2; a++) {
			let o = e + a;
			if (!(o < 0 || o >= c)) for (let e = -2; e <= 2; e++) {
				let a = t + e;
				if (a < 0 || a >= s) continue;
				let c = d[(o * s + a) * 3], l = Math.exp(-((c - n) ** 2) / 12.5);
				r += l * c, i += l;
			}
		}
		f[e * s + t] = r / i;
	}
	let p = /* @__PURE__ */ new Float32Array(3), m = /* @__PURE__ */ new Float32Array(3);
	for (let e = 0; e < s * c; e++) {
		p[0] = f[e], p[1] = d[e * 3 + 1], p[2] = d[e * 3 + 2];
		let t = 0, r = 0, s = 0, c = 0;
		for (let e of i) {
			let o = Math.hypot(p[1] - e.a, p[2] - e.b), l = i.length === 1 ? 1 : Math.exp(-(o * o) / (2 * a * a)) + 1e-9;
			ln(p[0], e.tones, n, m), t += l * m[0], r += l * m[1], s += l * m[2], c += l;
		}
		let l = t / c, h = r / c, g = s / c;
		if (u) {
			let t = Math.hypot(d[e * 3] - u.from.L, d[e * 3 + 1] - u.from.a, d[e * 3 + 2] - u.from.b), n = Math.min(1, Math.max(0, (dn - t) / (dn - un)));
			l += (u.to.L - l) * n, h += (u.to.a - h) * n, g += (u.to.b - g) * n;
		}
		Xt(Math.min(100, Math.max(0, l)), h, g, o, e * 4);
	}
	return o;
}
//#endregion
//#region src/original/faceConform.ts
var hn = .02, gn = [-.045, -.03], _n = 6, vn = 5e-4, yn = .04, bn = 20;
function xn(e) {
	let t = (t) => `${Math.round(e[t * 3] / 2e-5)},${Math.round(e[t * 3 + 1] / 2e-5)},${Math.round(e[t * 3 + 2] / 2e-5)}`, n = /* @__PURE__ */ new Map(), r = new Int32Array(e.length / 3);
	for (let e = 0; e < r.length; e++) {
		let i = t(e);
		n.has(i) || n.set(i, e), r[e] = n.get(i);
	}
	return r;
}
function Sn(e) {
	let t = xn(e.positions), n = /* @__PURE__ */ new Map(), r = e.triangles;
	for (let e = 0; e + 2 < r.length; e += 3) {
		let i = [
			t[r[e]],
			t[r[e + 1]],
			t[r[e + 2]]
		];
		for (let [e, t] of [
			[i[0], i[1]],
			[i[1], i[2]],
			[i[2], i[0]]
		]) {
			if (e === t) continue;
			let r = e < t ? `${e},${t}` : `${t},${e}`;
			n.set(r, (n.get(r) ?? 0) + 1);
		}
	}
	let i = /* @__PURE__ */ new Map();
	for (let [e, t] of n) {
		if (t !== 1) continue;
		let [n, r] = e.split(",").map(Number);
		i.set(n, [...i.get(n) ?? [], r]), i.set(r, [...i.get(r) ?? [], n]);
	}
	let a = /* @__PURE__ */ new Set(), o = [];
	for (let e of i.keys()) {
		if (a.has(e)) continue;
		let t = [], n = -1, r = e;
		for (; r !== void 0 && !a.has(r);) {
			a.add(r), t.push(r);
			let e = (i.get(r) ?? []).filter((e) => e !== n && !a.has(e));
			n = r, r = e[0];
		}
		o.push(t);
	}
	return o;
}
function Cn(t) {
	let n = [], r = -1;
	for (let i of Sn(t)) {
		let a = new e.Box3();
		for (let n of i) a.expandByPoint(new e.Vector3(t.positions[n * 3], t.positions[n * 3 + 1], t.positions[n * 3 + 2]));
		let o = a.getSize(new e.Vector3()), s = o.x + o.y + o.z;
		s > r && (r = s, n = i);
	}
	return n;
}
var wn = (t, n, r = new e.Vector3()) => r.set(t[n * 3], t[n * 3 + 1], t[n * 3 + 2]);
function Tn(t, n, r) {
	let i = n.map((n) => wn(t, n, new e.Vector3())), a = (e) => e.clone().sub(r.center).dot(r.up), o = 0;
	for (let e = 1; e < i.length; e++) a(i[e]) > a(i[o]) && (o = e);
	let s = [...i.slice(o), ...i.slice(0, o)], c = Math.max(1, Math.floor(s.length / 4)), l = (e) => e.reduce((e, t) => e + t.clone().sub(r.center).dot(r.across), 0) / e.length;
	l(s.slice(1, c + 1)) < l(s.slice(-c)) && (s = [s[0], ...s.slice(1).reverse()]);
	let u = [0];
	for (let e = 1; e <= s.length; e++) u.push(u[e - 1] + s[e - 1].distanceTo(s[e % s.length]));
	let d = u[s.length];
	return {
		points: s,
		share: u.slice(0, s.length).map((e) => e / d),
		total: d,
		order: [...n.slice(o), ...n.slice(0, o)]
	};
}
function En(t, n) {
	let r = [], i = n.points.length;
	for (let e = 0; e < i; e++) {
		let t = n.points[e], a = n.points[(e + 1) % i], o = Math.max(1, Math.ceil(t.distanceTo(a) / vn));
		for (let e = 0; e < o; e++) r.push(t.clone().lerp(a, e / o));
	}
	let a = r.length, o = Math.max(2, Math.ceil(yn / vn)), s = (t, n) => {
		let i = r[t % a], o = r[(t + n) % a], s = new e.Vector3().subVectors(o, i), c = new e.Vector3(), l = s.lengthSq() || 1, u = 0;
		for (let e = 1; e < n; e++) {
			let n = r[(t + e) % a], o = Math.min(1, Math.max(0, c.subVectors(n, i).dot(s) / l));
			u = Math.max(u, c.copy(i).addScaledVector(s, o).distanceToSquared(n));
		}
		return u;
	}, c = t.length, l = [], u = [];
	for (let e = 0; e < c; e++) l.push(new Float64Array(a).fill(Infinity)), u.push(new Int32Array(a).fill(-1));
	l[0][0] = t[0].distanceToSquared(r[0]);
	for (let e = 1; e < c; e++) {
		let n = t[e];
		for (let t = 0; t < a; t++) {
			let i = l[e - 1][t];
			if (Number.isFinite(i)) for (let c = 1; c <= o && t + c < a; c++) {
				let a = i + n.distanceToSquared(r[t + c]) + bn * s(t, c);
				a < l[e][t + c] && (l[e][t + c] = a, u[e][t + c] = t);
			}
		}
	}
	let d = -1, f = Infinity;
	for (let e = 0; e < a; e++) {
		let t = l[c - 1][e];
		if (!Number.isFinite(t) || a - e > o) continue;
		let n = t + bn * s(e, a - e);
		n < f && (f = n, d = e);
	}
	if (d < 0) return t.map((e) => e.clone());
	let p = Array(c);
	for (let e = c - 1, t = d; e >= 0; t = u[e][t], e--) p[e] = t;
	return p.map((e) => r[e].clone());
}
function Dn(e, t) {
	let n = e.points.length, r = 0;
	for (; r + 1 < n && e.share[r + 1] <= t;) r++;
	let i = (r + 1) % n, a = i === 0 ? 1 : e.share[i], o = a > e.share[r] ? (t - e.share[r]) / (a - e.share[r]) : 0;
	return e.points[r].clone().lerp(e.points[i], Math.min(1, Math.max(0, o)));
}
function On(t, n, r, i, a = {}) {
	let o = Cn(n), s = Cn(r);
	if (o.length < 3 || s.length < 3) return t;
	let c = Tn(n.positions, o, i), l = Tn(r.positions, s, i), u = (t) => {
		let n = new e.Vector3(), r = Infinity, i = l.points.length, a = new e.Vector3(), o = new e.Vector3();
		for (let e = 0; e < i; e++) {
			let s = l.points[e], c = l.points[(e + 1) % i];
			a.subVectors(c, s);
			let u = Math.min(1, Math.max(0, o.subVectors(t, s).dot(a) / (a.lengthSq() || 1)));
			o.copy(s).addScaledVector(a, u);
			let d = o.distanceTo(t);
			d < r && (r = d, n = o.clone());
		}
		return n;
	}, d = a.match ? [] : En(c.points, l), f = c.points.map((e, t) => {
		let n = e.clone().sub(i.center).dot(i.up), r = Math.min(1, Math.max(0, (n - gn[0]) / (gn[1] - gn[0])));
		return {
			p: e,
			move: (a.match === "nearest" ? u(e) : a.match === "length" ? Dn(l, c.share[t]) : d[t].clone()).sub(e).multiplyScalar(r)
		};
	}), p = new Set(o), m = (e) => e.clone().sub(i.center).dot(i.up), h = [], g = gn[0];
	for (let e of Sn(n)) {
		if (e.some((e) => p.has(e))) continue;
		let t = e.map((e) => wn(n.positions, e)), r = Math.min(...t.map(m));
		r < g && (g = r, h = t);
	}
	for (let t of h) f.push({
		p: t,
		move: new e.Vector3()
	});
	let _ = t.slice(), v = new e.Vector3();
	for (let n = 0; n < t.length / 3; n++) {
		if (a.follow && !a.follow[n]) continue;
		wn(t, n, v);
		let r = f.map((e) => ({
			m: e,
			d2: e.p.distanceToSquared(v)
		})).sort((e, t) => e.d2 - t.d2).slice(0, _n), i = Math.sqrt(r[0].d2);
		if (i >= hn || r[0].d2 < 1e-12 && r[0].m.move.lengthSq() === 0) continue;
		let o = 1 - i / hn, s = o * o * (3 - 2 * o), c = new e.Vector3(), l = 0;
		for (let { m: e, d2: t } of r) {
			let n = 1 / (t + 1e-8);
			c.addScaledVector(e.move, n), l += n;
		}
		v.addScaledVector(c, s / l), _[n * 3] = v.x, _[n * 3 + 1] = v.y, _[n * 3 + 2] = v.z;
	}
	return _;
}
//#endregion
//#region src/original/skinRecolor.ts
var kn = 5, An = 9;
function jn(e) {
	let t = Number.parseInt(e.replace(/^#/, "").slice(0, 6), 16), n = /* @__PURE__ */ new Float32Array(3);
	return Yt(t >> 16 & 255, t >> 8 & 255, t & 255, n, 0), [
		n[0],
		n[1],
		n[2]
	];
}
function Mn(e, t, n) {
	let r = [
		t.default,
		t.shadow1,
		t.shadow2
	].map(jn), i = [
		n.default,
		n.shadow1,
		n.shadow2
	].map(jn), a = e.data.slice(), o = /* @__PURE__ */ new Float32Array(3), s = /* @__PURE__ */ new Uint8Array(3);
	for (let t = 0; t < e.width * e.height; t++) {
		Yt(e.data[t * 4], e.data[t * 4 + 1], e.data[t * 4 + 2], o, 0);
		let n = Infinity, c = 0, l = 0;
		for (let e = 0; e < 2; e++) {
			let t = r[e], i = r[e + 1], a = [
				i[0] - t[0],
				i[1] - t[1],
				i[2] - t[2]
			], s = a[0] * a[0] + a[1] * a[1] + a[2] * a[2] || 1, u = Math.min(1, Math.max(0, ((o[0] - t[0]) * a[0] + (o[1] - t[1]) * a[1] + (o[2] - t[2]) * a[2]) / s)), d = Math.hypot(o[0] - (t[0] + u * a[0]), o[1] - (t[1] + u * a[1]), o[2] - (t[2] + u * a[2]));
			d < n && (n = d, c = e, l = u);
		}
		if (n >= An) continue;
		let u = Math.min(1, (An - n) / (An - kn)), d = r[c], f = r[c + 1], p = i[c], m = i[c + 1], h = [
			0,
			1,
			2
		].map((e) => p[e] + l * (m[e] - p[e]) - (d[e] + l * (f[e] - d[e])));
		Xt(o[0] + h[0], o[1] + h[1], o[2] + h[2], s, 0);
		for (let n = 0; n < 3; n++) a[t * 4 + n] = Math.round(e.data[t * 4 + n] + u * (s[n] - e.data[t * 4 + n]));
	}
	return a;
}
//#endregion
//#region src/original/faceHairShadow.ts
var I = 720, Nn = 5e-4, Pn = 50 * Math.PI / 180, Fn = 75 * Math.PI / 180, In = .001, Ln = .0015, Rn = 5e-4, zn = .002, Bn = 6, Vn = 2;
function Hn(e, t) {
	let n = [
		[],
		[],
		[]
	];
	for (let r = 0; r < t.length; r++) if (t[r]) for (let t = 0; t < 3; t++) n[t].push(e.data[r * 4 + t]);
	if (n[0].length === 0) throw Error("no texel to take a colour from");
	return n.map((e) => e.sort((e, t) => e - t)[e.length >> 1]);
}
function Un(e, t, n, r, i, a, o) {
	for (let s = 0; s + 2 < r.length; s += 3) {
		let c = r[s], l = r[s + 1], u = r[s + 2], d = n[c * 2] * e, f = n[c * 2 + 1] * t, p = n[l * 2] * e, m = n[l * 2 + 1] * t, h = n[u * 2] * e, g = n[u * 2 + 1] * t, _ = (p - d) * (g - f) - (m - f) * (h - d);
		if (_ === 0) continue;
		let v = Math.max(0, Math.floor(Math.min(d, p, h))), y = Math.min(e - 1, Math.ceil(Math.max(d, p, h))), b = Math.max(0, Math.floor(Math.min(f, m, g))), x = Math.min(t - 1, Math.ceil(Math.max(f, m, g)));
		for (let t = b; t <= x; t++) for (let n = v; n <= y; n++) {
			let r = n + .5, s = t + .5, v = ((p - r) * (g - s) - (m - s) * (h - r)) / _, y = ((h - r) * (f - s) - (g - s) * (d - r)) / _, b = 1 - v - y;
			if (v < 0 || y < 0 || b < 0) continue;
			let x = t * e + n;
			o[x] = 1;
			for (let e = 0; e < 3; e++) a[x * 3 + e] = v * i[c * 3 + e] + y * i[l * 3 + e] + b * i[u * 3 + e];
		}
	}
}
function Wn(t, n, r, i, a = new e.Vector3()) {
	a.set(n, r, i).sub(t.center);
	let o = a.dot(t.up), s = a.dot(t.across), c = a.dot(t.front);
	return {
		angle: Math.atan2(s, c),
		h: o,
		r: Math.hypot(s, c)
	};
}
function Gn(t, n, r, i, a) {
	let o = new Float32Array(I * a), s = new e.Vector3(), c = (e) => {
		let r = Wn(t, n[e * 3], n[e * 3 + 1], n[e * 3 + 2], s);
		return {
			x: (r.angle + Math.PI) / (2 * Math.PI) * I,
			y: (r.h - i) / Nn,
			r: r.r
		};
	};
	for (let e = 0; e + 2 < r.length; e += 3) {
		let t = c(r[e]), n = c(r[e + 1]), i = c(r[e + 2]);
		if (Math.max(t.x, n.x, i.x) - Math.min(t.x, n.x, i.x) > I / 2) continue;
		let s = (n.x - t.x) * (i.y - t.y) - (n.y - t.y) * (i.x - t.x), l = Math.max(0, Math.floor(Math.min(t.x, n.x, i.x))), u = Math.min(I - 1, Math.ceil(Math.max(t.x, n.x, i.x))), d = Math.max(0, Math.floor(Math.min(t.y, n.y, i.y))), f = Math.min(a - 1, Math.ceil(Math.max(t.y, n.y, i.y)));
		for (let e = d; e <= f; e++) for (let r = l; r <= u; r++) {
			let a;
			if (Math.abs(s) < 1e-9) a = Math.max(t.r, n.r, i.r);
			else {
				let o = r + .5, c = e + .5, l = ((n.x - o) * (i.y - c) - (n.y - c) * (i.x - o)) / s, u = ((i.x - o) * (t.y - c) - (i.y - c) * (t.x - o)) / s, d = 1 - l - u;
				if (l < -.5 || u < -.5 || d < -.5) continue;
				a = Math.max(0, l) * t.r + Math.max(0, u) * n.r + Math.max(0, d) * i.r;
			}
			let c = e * I + r;
			a > o[c] && (o[c] = a);
		}
	}
	return o;
}
function Kn(t) {
	let { color: n, shadow: r, skin: i, frame: a, faceAt: o, region: s, hairMap: c, h0: l, rows: u } = t, d = n.data.slice(), f = new e.Vector3(), p = (e) => {
		let t = 0, a = 0;
		for (let o = 0; o < 3; o++) {
			let s = r.data[e * 4 + o] - i[o];
			t += (n.data[e * 4 + o] - i[o]) * s, a += s * s;
		}
		return a < 1 ? 0 : Math.min(1, Math.max(0, t / a));
	}, m = [];
	for (let e = 0; e < s.length; e++) s[e] && m.push({
		i: e,
		...Wn(a, o[e * 3], o[e * 3 + 1], o[e * 3 + 2], f)
	});
	if (m.length === 0) return d;
	let h = m.filter((e) => Math.abs(e.angle) < Pn), g = h.length ? Math.min(...h.map((e) => e.h)) : 0, _ = h.length ? Math.max(...h.map((e) => e.h)) : 0, v = Math.max(1, Math.ceil((_ - g) / .001) + 1), y = Array.from({ length: v }, () => []);
	for (let e of h) y[Math.floor((e.h - g) / .001)].push(p(e.i));
	let b = y.map((e) => e.length ? e.sort((e, t) => e - t)[Math.floor(e.length * .9)] : NaN), x = b.map((e, t) => {
		let n = [
			b[t - 1],
			b[t],
			b[t + 1]
		].filter((e) => e !== void 0 && Number.isFinite(e));
		return n.length ? n.reduce((e, t) => e + t, 0) / n.length : 0;
	}), S = (e) => e < g || e > _ || !h.length ? 0 : x[Math.floor((e - g) / .001)], C = (e) => Math.min(I - 1, Math.max(0, Math.floor((e + Math.PI) / (2 * Math.PI) * I))), w = new Float32Array(I * u);
	for (let e of m) {
		let t = Math.floor((e.h - l) / Nn);
		if (t < 0 || t >= u) continue;
		let n = t * I + C(e.angle);
		e.r > w[n] && (w[n] = e.r);
	}
	let T = new Float64Array(I).fill(NaN), E = Math.ceil(zn / Nn);
	for (let e = 0; e < I; e++) {
		let t = Infinity, n = !1;
		for (let r = 0; r < u; r++) {
			let i = w[r * I + e];
			if (!i || (n = !0, c[r * I + e] < i + Rn)) continue;
			let a = !0;
			for (let t = 1; t <= E && r + t < u; t++) {
				let n = w[(r + t) * I + e];
				if (n && c[(r + t) * I + e] < n + Rn) {
					a = !1;
					break;
				}
			}
			if (a) {
				t = l + r * Nn;
				break;
			}
		}
		n && (T[e] = t);
	}
	let D = _ + In + Ln, O = Array.from(T, (e) => Number.isNaN(e) ? NaN : Math.min(e, D)), k = O.map((e, t) => {
		if (Number.isNaN(e)) return e;
		let n = [];
		for (let e = -4; e <= 4; e++) {
			let r = O[t + e];
			r !== void 0 && !Number.isNaN(r) && n.push(r);
		}
		return n.sort((e, t) => e - t), n[n.length >> 1];
	}), A = k.map((e, t) => {
		if (Number.isNaN(e)) return e;
		let n = 0, r = 0;
		for (let e = -3 * Bn; e <= 3 * Bn; e++) {
			let i = k[t + e];
			if (i === void 0 || Number.isNaN(i)) continue;
			let a = Math.exp(-(e * e) / (2 * Bn * Bn));
			n += a * i, r += a;
		}
		return n / r;
	}), ee = new Float32Array(s.length);
	for (let e of m) {
		let t = Math.min(1, Math.max(0, (Math.abs(e.angle) - Pn) / (Fn - Pn))), n = A[C(e.angle)];
		if (Number.isNaN(n) || t >= 1) continue;
		let r = Math.min(1, Math.max(0, (e.h - (n - In)) / Ln + .5));
		ee[e.i] = r * r * (3 - 2 * r) * S(e.h) * (1 - t);
	}
	let { width: te, height: ne } = n, re = (e, t, n) => {
		let r = new Float32Array(e.length);
		for (let i of m) {
			let a = i.i % te, o = (i.i - a) / te, c = 0, l = 0;
			for (let r = -2; r <= Vn; r++) {
				let i = a + r * t, u = o + r * n;
				if (i < 0 || u < 0 || i >= te || u >= ne) continue;
				let d = u * te + i;
				s[d] && (c += e[d], l++);
			}
			r[i.i] = l ? c / l : e[i.i];
		}
		return r;
	}, ie = re(re(ee, 1, 0), 0, 1);
	for (let e of m) {
		let t = ie[e.i];
		for (let n = 0; n < 3; n++) d[e.i * 4 + n] = Math.round(i[n] + t * (r.data[e.i * 4 + n] - i[n]));
	}
	return d;
}
var qn = (e, t) => Math.max(1, Math.ceil((t - e) / Nn)), Jn = "borrowed-hair:", Yn = "borrowed-body:", Xn = ["_MainTex", "_ShadowTex"], Zn = 18, L = 36, Qn = .0015, $n = [-.004, .012], er = /* @__PURE__ */ new WeakMap(), tr = (e) => e.startsWith(Jn), nr = (e) => e.startsWith(Yn);
function R(e, t) {
	if (!e) throw Error(t);
}
var rr = (e) => -e;
async function ir(e, t, n, r, i = null) {
	let a = t.role;
	R(a, "a borrowed part needs the part set's role"), R(r !== a.characterId, "a character cannot borrow its own parts");
	let o = await e.characterUnit(r), s = await e.roleIndex(r, o), c = i ?? (n === "hair" ? s.role.hairCostume3dId : n === "body" ? s.role.bodyCostume3dId : null);
	R(c != null, `character ${r}: a borrowed head needs its costume3dId`);
	let l = rr(c), u = t.registry.find((e) => e.partType === n && e.costume3dId === l);
	if (u) return u;
	let d = s.registry.find((e) => e.partType === n && e.costume3dId === c);
	R(d?.bundlePath, `character ${r} has no ${n} ${c}`), n === "head" && R(d.headCostume3dAssetbundleType?.toLowerCase() === "head_and_hair", `head ${c} of character ${r} is not a complete head (head_and_hair)`);
	let f = t.registry.find((e) => e.partType === "hair" && e.costume3dId === a.hairCostume3dId);
	R(f?.bundlePath, `role ${a.characterId} has no default hair bundle`);
	let p = er.get(t) ?? /* @__PURE__ */ new Map();
	er.set(t, p);
	let m = n === "body" ? Yn : Jn, h = (e) => `${m}${a.characterId}:${r}:${e}`, g = n === "body" && s.role.skinColors && a.skinColors ? {
		from: s.role.skinColors,
		to: a.skinColors
	} : null;
	p.set(h(d.packagePath), {
		source: d,
		palette: f,
		roleCharacterId: a.characterId,
		skin: g
	});
	let _ = d.headTypeVariants ? Object.fromEntries(Object.entries(d.headTypeVariants).flatMap(([e, t]) => t ? (p.set(h(t.packagePath), {
		source: {
			...d,
			bundlePath: t.bundlePath,
			packagePath: t.packagePath
		},
		palette: f,
		roleCharacterId: a.characterId
	}), [[e, {
		bundlePath: t.bundlePath,
		packagePath: h(t.packagePath)
	}]]) : [])) : null, v = {
		...d,
		characterId: a.characterId,
		unit: a.unit,
		costume3dId: l,
		packagePath: h(d.packagePath),
		headTypeVariants: _
	};
	return t.registry = [...t.registry, v], v;
}
async function ar(e, t, n) {
	let r = er.get(t)?.get(n.packagePath);
	R(r, `no source for borrowed body ${n.packagePath}`);
	let i = await e.build(r.source), a = r.skin, o = i.materialSlots ?? [], s = /* @__PURE__ */ new Map(), c = a ? o.map((e) => ({
		...e,
		rawMaterial: {
			...e.rawMaterial,
			textureProperties: e.rawMaterial.textureProperties.map((e) => {
				if (!e.uri || !Xn.includes(e.name)) return e;
				let t = s.get(e.uri);
				if (!t) {
					let n = e.uri;
					t = `original:skin/${r.roleCharacterId}/${n.slice(9)}`, qt().define(t, async () => {
						let e = qt().payload(n);
						return R(e, `borrowed body texture ${n} was not delivered`), ur(Mn({
							width: e.width,
							height: e.height,
							data: await Wt(e)
						}, a.from, a.to), e.width, e.height, `${e.name} (skin)`);
					}), s.set(n, t);
				}
				return {
					...e,
					uri: t,
					textureKey: `${e.textureKey ?? ""}#skin/${r.roleCharacterId}`
				};
			})
		}
	})) : o;
	return {
		...i,
		materialSlots: c,
		packagePath: n.packagePath,
		part: {
			...i.part,
			costume3dId: n.costume3dId,
			characterId: n.characterId,
			unit: n.unit ?? null
		}
	};
}
function or(e) {
	let t = e.nativeMeshes?.meshes ?? [], n = t.filter((e) => e.meshName === "Hair"), r = n.length ? n : t, i = new Set(r.flatMap((e) => e.submeshes.map((t) => `${e.meshName}|${t.materialKey}`))), a = (e.materialSlots ?? []).filter((e) => i.has(`${e.meshName}|${e.materialKey}`)), o = {};
	for (let e of Xn) {
		let t = a.flatMap((e) => e.rawMaterial.textureProperties).find((t) => t.name === e && t.uri)?.uri;
		t && (o[e] = t);
	}
	return {
		uris: o,
		uvs: r.flatMap((e) => e.submeshes.map((t) => ({
			uv: e.uv0,
			indices: t.indices
		})))
	};
}
function sr(e, t, n) {
	let r = new Uint8Array(e * t);
	for (let { uv: i, indices: a } of n.uvs) Zt(e, t, i, a, r);
	return r;
}
function cr(e, t, n, r) {
	if (!e) return null;
	let i = new Uint8Array(n * r);
	for (let a of e.submeshes) t.has(a.materialKey) && Zt(n, r, e.uv0, a.indices, i);
	return xr(i, n, r);
}
async function lr(e, t, n, r, i) {
	let a = qt(), o = a.payload(e), s = a.payload(t);
	R(o && s, `borrowed hair textures ${e} / ${t} were not delivered`);
	let [c, l] = await Promise.all([Wt(o), Wt(s)]), { width: u, height: d } = o, f = sr(u, d, n), p = {
		width: u,
		height: d,
		data: c
	}, m = nn({
		width: s.width,
		height: s.height,
		data: l
	}, sr(s.width, s.height, r)), h = {
		width: s.width,
		height: s.height,
		data: l
	}, g = cr(i.donor.face, i.donor.keys, u, d), _ = cr(i.role.face, i.role.keys, s.width, s.height), v = g ? pn(p, g) : null, y = _ ? pn(h, _) : null;
	return ur(mn(p, on(p, f), m, v && y ? {
		from: v,
		to: y
	} : null), u, d, `${o.name} (recoloured)`);
}
function ur(t, n, r, i) {
	let a = new e.DataTexture(t, n, r, e.RGBAFormat, e.UnsignedByteType);
	return a.name = i, a.flipY = !1, a.generateMipmaps = !1, a.colorSpace = e.NoColorSpace, a.needsUpdate = !0, a;
}
function dr(t) {
	let n = (t.bonePaths ?? []).findIndex((e) => e === "Head" || e.endsWith("/Head")), r = t.boneInverseBindMatrices;
	return n < 0 || !r || r.length < (n + 1) * 16 ? null : new e.Matrix4().fromArray(Array.from({ length: 16 }, (e, t) => r[n * 16 + t]));
}
function fr(t) {
	let n = dr(t), r = t.positions;
	if (!n || !r || r.length < 3) return null;
	let i = [
		[],
		[],
		[]
	], a = new e.Vector3();
	for (let e = 0; e + 2 < r.length; e += 3) a.set(r[e], r[e + 1], r[e + 2]).applyMatrix4(n), i[0].push(a.x), i[1].push(a.y), i[2].push(a.z);
	return i.map((e) => (e.sort((e, t) => e - t), [e[Math.floor(e.length * .005)], e[Math.floor(e.length * .995)]]));
}
function pr(t) {
	let n = (e) => Math.abs(t[e][0] + t[e][1]) / (t[e][1] - t[e][0]), r = [
		0,
		1,
		2
	].reduce((e, t) => n(t) < n(e) ? t : e, 0), [i, a] = [
		0,
		1,
		2
	].filter((e) => e !== r), o = (e) => t[e][1] - t[e][0], s = o(i) >= o(a) ? i : a, c = s === i ? a : i, l = (e) => Math.abs(t[e][0]) > Math.abs(t[e][1]) ? -1 : 1, u = (t, n) => new e.Vector3().setComponent(t, n), d = l(s) < 0 ? t[s][0] : t[s][1];
	return {
		center: u(s, 1).multiplyScalar(d / 2),
		up: u(s, l(s)),
		across: u(r, 1),
		front: u(c, l(c))
	};
}
function mr(t, n, r = new e.Vector3()) {
	r.subVectors(n, t.center);
	let i = r.length(), a = Math.acos(Math.min(1, Math.max(-1, r.dot(t.up) / (i || 1)))), o = Math.atan2(r.dot(t.across), r.dot(t.front));
	return {
		row: a / Math.PI * Zn - .5,
		column: (o + Math.PI) / (2 * Math.PI) * L - .5,
		r: i
	};
}
function hr(t, n, r) {
	let i = new Float32Array(Zn * L).fill(NaN), a = dr(t), o = t.positions;
	if (!a || !o) return i;
	let s = new e.Vector3();
	for (let e = 0; e + 2 < o.length; e += 3) {
		if (r && !r[e / 3]) continue;
		s.set(o[e], o[e + 1], o[e + 2]).applyMatrix4(a);
		let { row: t, column: c, r: l } = mr(n, s), u = Math.min(Zn - 1, Math.max(0, Math.round(t))) * L + (Math.round(c) % L + L) % L;
		i[u] >= l || (i[u] = l);
	}
	return i;
}
function gr(e, t) {
	let n = new Float32Array(e.length), r = new Float32Array(e.length);
	for (let i = 0; i < n.length; i++) Number.isFinite(e[i]) && Number.isFinite(t[i]) && (n[i] = e[i] - t[i] + Qn, r[i] = 1);
	let i = (e) => {
		let t = new Float32Array(e.length);
		for (let n = 0; n < Zn; n++) for (let r = 0; r < L; r++) {
			let i = 0;
			for (let t = -1; t <= 1; t++) {
				let a = Math.min(Zn - 1, Math.max(0, n + t));
				for (let t = -1; t <= 1; t++) i += e[a * L + (r + t + L) % L];
			}
			t[n * L + r] = i / 9;
		}
		return t;
	};
	for (let e = 0; e < 2; e++) n = i(n), r = i(r);
	return n.map((e, t) => Math.min($n[1], Math.max($n[0], e / (r[t] + .2) * 1.2)));
}
function _r(e, t, n) {
	let r = Math.floor(t), i = Math.floor(n), a = t - r, o = n - i, s = (t, n) => e[Math.min(Zn - 1, Math.max(0, t)) * L + (n % L + L) % L];
	return (s(r, i) * (1 - o) + s(r, i + 1) * o) * (1 - a) + (s(r + 1, i) * (1 - o) + s(r + 1, i + 1) * o) * a;
}
function vr(t, n, r, i = {}) {
	let a = dr(t), o = fr(r);
	if (!a || !t.positions || !o) return t;
	let s = pr(o), c = gr(hr(n, s, i.role), hr(r, s, i.donor)), l = a.clone().invert(), u = new Float32Array(t.positions.length), d = new e.Vector3(), f = new e.Vector3();
	for (let e = 0; e + 2 < u.length; e += 3) {
		d.set(t.positions[e], t.positions[e + 1], t.positions[e + 2]).applyMatrix4(a);
		let { row: n, column: r, r: i } = mr(s, d, f);
		i > 0 && d.addScaledVector(f, _r(c, n, r) / i), d.applyMatrix4(l), u[e] = d.x, u[e + 1] = d.y, u[e + 2] = d.z;
	}
	return {
		...t,
		positions: u
	};
}
var yr = (e) => /^mtl_chr_\d+/.test(e.materialName ?? ""), br = (e) => /^mtl_chr_eye_/i.test(e.materialName ?? "");
function xr(e, t, n) {
	let r = new Int32Array(e.length).fill(-1), i = -1, a = 0, o = 0, s = [];
	for (let c = 0; c < e.length; c++) {
		if (!e[c] || r[c] !== -1) continue;
		let l = o++, u = 0;
		for (r[c] = l, s.push(c); s.length;) {
			let i = s.pop();
			u++;
			let a = i % t, o = (i - a) / t;
			for (let c of [
				a > 0 ? i - 1 : -1,
				a < t - 1 ? i + 1 : -1,
				o > 0 ? i - t : -1,
				o < n - 1 ? i + t : -1
			]) c >= 0 && e[c] && r[c] === -1 && (r[c] = l, s.push(c));
		}
		u > a && (a = u, i = l);
	}
	let c = new Uint8Array(e.length);
	for (let t = 0; t < e.length; t++) r[t] === i && (c[t] = 1);
	return c;
}
function Sr(e, t) {
	let n = e.submeshes.filter((e) => t.has(e.materialKey));
	if (n.length === 0) return null;
	let r = new Uint8Array(256 * 256);
	for (let t of n) Zt(256, 256, e.uv0, t.indices, r);
	let i = xr(r, 256, 256), a = 256, o = -1, s = 256, c = -1;
	for (let e = 0; e < i.length; e++) {
		if (!i[e]) continue;
		let t = e % 256, n = (e - t) / 256;
		a = Math.min(a, t), o = Math.max(o, t), s = Math.min(s, n), c = Math.max(c, n);
	}
	if (o < 0) return null;
	let l = new Uint8Array(e.uv0.length / 2);
	for (let t of n) for (let n of Array.from(t.indices)) {
		let t = e.uv0[n * 2] * 256, r = e.uv0[n * 2 + 1] * 256;
		t >= a - 1 && t <= o + 2 && r >= s - 1 && r <= c + 2 && (l[n] = 1);
	}
	return l;
}
function Cr(t, n, r, i) {
	let a = dr(t), o = wr(t), s = wr(n), c = fr(n);
	if (!a || !o || !s || !c) return t;
	let l = (e, t) => e.submeshes.filter((e) => t.has(e.materialKey)).flatMap((e) => Array.from(e.indices)), u = l(t, r), d = l(n, i);
	if (!u.length || !d.length) return t;
	let f = On(o, {
		positions: o,
		triangles: u
	}, {
		positions: s,
		triangles: d
	}, pr(c)), p = a.clone().invert(), m = new Float32Array(f.length), h = new e.Vector3();
	for (let e = 0; e + 2 < m.length; e += 3) h.set(f[e], f[e + 1], f[e + 2]).applyMatrix4(p), m[e] = h.x, m[e + 1] = h.y, m[e + 2] = h.z;
	return {
		...t,
		positions: m
	};
}
function wr(t) {
	let n = dr(t), r = t.positions;
	if (!n || !r) return null;
	let i = new Float32Array(r.length), a = new e.Vector3();
	for (let e = 0; e + 2 < r.length; e += 3) a.set(r[e], r[e + 1], r[e + 2]).applyMatrix4(n), i[e] = a.x, i[e + 1] = a.y, i[e + 2] = a.z;
	return i;
}
async function Tr(t, n, r, i) {
	let a = qt(), o = a.payload(t.color), s = a.payload(t.shadow);
	R(o && s, "the face's textures were not delivered");
	let { width: c, height: l, name: u } = o, [d, f] = await Promise.all([Wt(o), Wt(s)]), p = fr(n), m = wr(n);
	if (!p || !m || s.width !== c || s.height !== l) return ur(d, c, l, u);
	let h = pr(p), g = (t, n) => new e.Vector3(t[n * 3], t[n * 3 + 1], t[n * 3 + 2]).sub(h.center).dot(h.up), _ = n.submeshes.filter((e) => i.eye.has(e.materialKey)).flatMap((e) => Array.from(e.indices));
	if (_.length === 0) return ur(d, c, l, u);
	let v = Math.max(..._.map((e) => g(m, e))), y = new Float32Array(c * l * 3), b = new Uint8Array(c * l);
	for (let e of n.submeshes) i.skin.has(e.materialKey) && Un(c, l, n.uv0, e.indices, m, y, b);
	let x = new Uint8Array(c * l), S = new Uint8Array(c * l), C = xr(b, c, l), w = v, T = v, E = new e.Vector3();
	for (let e = 0; e < b.length; e++) {
		if (!C[e]) continue;
		E.set(y[e * 3], y[e * 3 + 1], y[e * 3 + 2]).sub(h.center);
		let t = E.dot(h.up), n = Math.abs(Math.atan2(E.dot(h.across), E.dot(h.front)));
		t >= v || n >= Pn ? (x[e] = 1, w = Math.max(w, t), T = Math.min(T, t)) : t < v - .01 && n < Pn - .2 && (S[e] = 1);
	}
	let D = T - .01, O = qn(D, w + .03), k = new Float32Array(O * 720);
	for (let e of r) {
		let t = wr(e);
		if (!t) continue;
		let n = Gn(h, t, e.submeshes.flatMap((e) => Array.from(e.indices)), D, O);
		for (let e = 0; e < n.length; e++) n[e] > k[e] && (k[e] = n[e]);
	}
	let A = (e) => ({
		width: c,
		height: l,
		data: e
	});
	return ur(Kn({
		color: A(d),
		shadow: A(f),
		skin: Hn(A(d), S),
		frame: h,
		faceAt: y,
		region: x,
		hairMap: k,
		h0: D,
		rows: O
	}), c, l, `${u} (hair shadow)`);
}
async function Er(e, t, n) {
	let r = er.get(t)?.get(n.packagePath);
	R(r, `no source for borrowed hair ${n.packagePath}`);
	let [i, a] = await Promise.all([e.build(r.source), e.build(r.palette)]), o = or(i), s = or(a), c = /* @__PURE__ */ new Map(), l = (e) => (e.nativeMeshes?.meshes ?? []).find((e) => e.meshName === "Face"), u = (e) => new Set((e.materialSlots ?? []).filter((e) => e.meshName === "Face" && yr(e)).map((e) => e.materialKey)), d = {
		donor: {
			face: l(i),
			keys: u(i)
		},
		role: {
			face: l(a),
			keys: u(a)
		}
	};
	for (let e of Xn) {
		let t = o.uris[e], n = s.uris[e];
		if (!t || !n) continue;
		let i = `original:recolor/${r.roleCharacterId}/${t.slice(9)}`;
		qt().define(i, () => lr(t, n, o, s, d)), c.set(t, i);
	}
	let f = (e) => e === "Hair", p = (e) => e === "Face", m = (i.materialSlots ?? []).filter((e) => !p(e.meshName)).map((e) => f(e.meshName) ? {
		...e,
		rawMaterial: {
			...e.rawMaterial,
			textureProperties: e.rawMaterial.textureProperties.map((e) => {
				let t = e.uri ? c.get(e.uri) : void 0;
				return t ? {
					...e,
					uri: t,
					textureKey: `${e.textureKey ?? ""}#recolor/${r.roleCharacterId}`
				} : e;
			})
		}
	} : e), h = (a.materialSlots ?? []).filter((e) => p(e.meshName)), g = i.springBone?.prefabGraph?.transforms ?? [], _ = new Map(g.filter((e) => e.transformPath).map((e) => [e.transformPath, e.pathId])), v = g.map((e) => e.transformPath).find((e) => e?.endsWith("/Head"));
	R(v, "the donor's hierarchy has no Head");
	let y = (e) => _.has(e) ? e : v, b = i.nativeMeshes?.meshes ?? [], x = (a.nativeMeshes?.meshes ?? []).filter((e) => p(e.meshName)).map((e) => {
		let t = e.rendererTransformPath ?? null;
		R(t && _.has(t), `the donor's hierarchy has no ${t ?? "renderer node"} for the role's ${e.meshName}`);
		let n = (e.bonePaths ?? []).map((e) => e === "" ? "" : y(e));
		return {
			...e,
			rendererTransformPathId: _.get(t),
			bonePaths: n,
			bonePathIds: n.map((e) => e === "" ? 0 : _.get(e)),
			rootBonePath: e.rootBonePath ? y(e.rootBonePath) : e.rootBonePath ?? null,
			rootBonePathId: e.rootBonePath ? _.get(y(e.rootBonePath)) : e.rootBonePathId ?? null
		};
	}), S = i.nativeMeshes ?? {}, C = b.find((e) => e.meshName === "Face"), w = new Set(h.filter(yr).map((e) => e.materialKey)), T = new Set((i.materialSlots ?? []).filter((e) => e.meshName === "Face" && yr(e)).map((e) => e.materialKey));
	for (let e = 0; e < x.length; e++) {
		let t = x[e];
		t.meshName === "Face" && C && (x[e] = {
			...t,
			...Cr(t, C, w, T)
		});
	}
	let E = x.find((e) => e.meshName === "Face"), D = b.filter((e) => !p(e.meshName)).map((e) => E && C ? vr(e, E, C, {
		role: Sr(E, w),
		donor: Sr(C, T)
	}) : e), O = {
		color: s.uris._MainTex,
		shadow: s.uris._ShadowTex
	}, k = {
		skin: new Set(h.filter(yr).map((e) => e.materialKey)),
		eye: new Set(h.filter(br).map((e) => e.materialKey))
	}, A = null;
	if (O.color && O.shadow && E && k.skin.size && k.eye.size) {
		A = `original:hairshadow/${n.costume3dId}/${O.color.slice(9)}`;
		let [e, t, r] = [
			O.color,
			O.shadow,
			E
		];
		qt().define(A, () => Tr({
			color: e,
			shadow: t
		}, r, D, k));
	}
	let ee = h.map((e) => A ? {
		...e,
		rawMaterial: {
			...e.rawMaterial,
			textureProperties: e.rawMaterial.textureProperties.map((e) => e.uri === O.color ? {
				...e,
				uri: A,
				textureKey: `${e.textureKey ?? ""}#hairshadow/${n.costume3dId}`
			} : e)
		}
	} : e), te = {
		...i.characterControllers ?? {},
		eye: a.characterControllers?.eye
	};
	return {
		...i,
		packagePath: n.packagePath,
		part: {
			...i.part,
			costume3dId: n.costume3dId,
			characterId: n.characterId,
			unit: n.unit ?? null
		},
		nativeMeshes: {
			...S,
			meshes: [...x, ...D]
		},
		materialSlots: [...ee, ...m],
		characterControllers: te
	};
}
//#endregion
//#region src/runtime/runtimePackageLoader.ts
async function Dr(e, t) {
	let n = Ar(t.roleId), r = await e.roleIndex(n.characterId, n.unit);
	if (r.registry.length === 0) throw Error(`The master rows have no parts for role ${t.roleId}.`);
	let i = {
		registry: r.registry,
		role: r.role,
		masterVersion: r.masterVersion,
		compatibility: r.compatibility,
		packages: /* @__PURE__ */ new Map(),
		contentId: e.id
	}, a = new _t({ loadPartRuntime: (t) => kr(e, i, t) });
	return a.loadPartPackageSet(i), {
		combinedCharacter: t.deferDefaultSelection ? null : await a.setCustomSelection(Or(r.role)),
		partSet: i,
		wardrobe: a
	};
}
function Or(e) {
	return {
		characterId: e.characterId,
		unit: e.unit,
		bodyCostume3dId: e.bodyCostume3dId,
		headCostume3dId: e.headCostume3dId,
		headPackagePath: null,
		hairCostume3dId: e.hairCostume3dId,
		headOptionalCostume3dId: null
	};
}
async function kr(e, t, n) {
	let r = t.packages.get(n.packagePath);
	if (r) return r;
	let i = tr(n.packagePath) ? await Er(e, t, n) : nr(n.packagePath) ? await ar(e, t, n) : await e.build(n);
	return t.packages.set(n.packagePath, i), i;
}
function Ar(e) {
	if (!e) throw Error("Runtime role id is required.");
	let [t, ...n] = e.split(":"), r = Number(t);
	if (!Number.isInteger(r) || r <= 0) throw Error(`Invalid runtime role id: ${e}`);
	return {
		characterId: r,
		unit: n.join(":") || null
	};
}
//#endregion
//#region src/engine/unityCoordinateConversion.ts
var jr = {
	right: new e.Vector3(1, 0, 0),
	left: new e.Vector3(-1, 0, 0),
	up: new e.Vector3(0, 1, 0),
	down: new e.Vector3(0, -1, 0),
	forward: new e.Vector3(0, 0, 1),
	back: new e.Vector3(0, 0, -1)
};
function Mr(t, n) {
	if (!t) return n.clone();
	let r = Kr(t.x ?? t.X), i = Kr(t.y ?? t.Y), a = Kr(t.z ?? t.Z);
	return r === null || i === null || a === null ? n.clone() : new e.Vector3(r, i, a);
}
function Nr(t) {
	if (!t) return new e.Quaternion();
	let n = Kr(t.x ?? t.X), r = Kr(t.y ?? t.Y), i = Kr(t.z ?? t.Z), a = Kr(t.w ?? t.W);
	return n === null || r === null || i === null || a === null ? new e.Quaternion() : Pr(new e.Quaternion(n, r, i, a));
}
function Pr(e) {
	let t = Math.fround, n = t(e.x), r = t(e.y), i = t(e.z), a = t(e.w), o = t(n * n), s = t(r * r), c = t(i * i), l = t(a * a), u = t(t(o + s) + t(c + l)), d = t(t(s + c) + t(l + o)), f = t(Math.sqrt(u)), p = t(Math.sqrt(d));
	return e.set(u > t(1e-30) ? t(n / f) : 0, d > t(1e-30) ? t(r / p) : 0, u > t(1e-30) ? t(i / f) : 0, d > t(1e-30) ? t(a / p) : 1);
}
function Fr(t) {
	return new e.Vector3(-t.x, t.y, t.z);
}
function Ir(e) {
	return Fr(e);
}
function Lr(t) {
	return new e.Quaternion(t.x, -t.y, -t.z, t.w);
}
function Rr(e) {
	return Ir(jr[e]);
}
function z(e, t) {
	let n = Math.fround;
	t.identity();
	for (let r = e; r; r = r.parent) {
		let e = n(r.quaternion.x), i = n(r.quaternion.y), a = n(r.quaternion.z), o = n(r.quaternion.w), s = r.scale.x < 0 ? -1 : 1, c = r.scale.y < 0 ? -1 : 1, l = r.scale.z < 0 ? -1 : 1, u = t.x * c * l, d = t.y * s * l, f = t.z * s * c, p = t.w;
		t.set(n(n(n(n(i * f) - n(a * d)) + n(o * u)) + n(e * p)), n(n(n(n(a * u) - n(e * f)) + n(o * d)) + n(i * p)), n(n(n(n(o * f) - n(i * u)) + n(a * p)) + n(e * d)), n(n(n(n(o * p) - n(e * u)) - n(a * f)) - n(i * d)));
	}
	return t;
}
var zr = new e.Quaternion();
function B(e, t) {
	let n = Math.fround;
	t.set(n(e.position.x), n(e.position.y), n(e.position.z));
	for (let r = e.parent; r; r = r.parent) t.set(n(t.x * n(r.scale.x)), n(t.y * n(r.scale.y)), n(t.z * n(r.scale.z))), Hr(t, r.quaternion), t.set(n(t.x + n(r.position.x)), n(t.y + n(r.position.y)), n(t.z + n(r.position.z)));
	return t;
}
function Br(e, t) {
	let n = [];
	for (let t = e; t; t = t.parent) n.push(t);
	let r = Math.fround;
	t.set(r(t.x), r(t.y), r(t.z));
	for (let e = n.length - 1; e >= 0; e--) {
		let i = n[e];
		t.set(r(t.x - r(i.position.x)), r(t.y - r(i.position.y)), r(t.z - r(i.position.z))), Hr(t, i.quaternion, !0), t.set(r(t.x * Vr(i.scale.x)), r(t.y * Vr(i.scale.y)), r(t.z * Vr(i.scale.z)));
	}
	return t;
}
function Vr(e) {
	let t = Math.fround, n = t(e), r = Math.abs(n);
	if (r < t(1e-9)) return 0;
	if (!Number.isFinite(n)) return 1 / n;
	let i = 2 ** Math.floor(Math.log2(r)), a = Math.floor((r / i - 1) * 2048), o = t(Math.sign(n) * Math.round(8192 / (1 + (a + .5) / 2048)) / 8192 / i), s = t(o * t(2.000000476837158 - t(o * n)));
	return s = t(s * t(2 - t(s * n))), Number.isNaN(s) ? o : s;
}
function Hr(e, t, n = !1) {
	let r = Math.fround, i = e.x, a = e.y, o = e.z, s = n ? -1 : 1, c = s * r(t.x), l = s * r(t.y), u = s * r(t.z), d = r(t.w), f = r(r(-2 * l * l) - r(2 * u * u)), p = r(r(-2 * u * d) - r(-2 * c * l)), m = r(r(2 * c * u) - r(-2 * l * d)), h = r(r(2 * l * c) - r(-2 * u * d)), g = r(r(-2 * u * u) - r(2 * c * c)), _ = r(r(-2 * c * d) - r(-2 * l * u)), v = r(r(-2 * l * d) - r(-2 * u * c)), y = r(r(2 * u * l) - r(-2 * c * d)), b = r(r(-2 * c * c) - r(2 * l * l));
	e.set(r(r(r(f * i) + i) + r(r(p * a) + r(m * o))), r(r(r(h * i) + a) + r(r(g * a) + r(_ * o))), r(r(r(v * i) + o) + r(r(y * a) + r(b * o))));
}
function Ur(e, t) {
	return t.copy(Wr(t, z(e, zr)));
}
function Wr(t, n) {
	let r = Math.fround, i = r(n.x * 2), a = r(n.y * 2), o = r(n.z * 2), s = r(n.x * i), c = r(n.y * a), l = r(n.z * o), u = r(n.x * a), d = r(n.x * o), f = r(n.y * o), p = r(n.w * i), m = r(n.w * a), h = r(n.w * o);
	return new e.Vector3(r((1 - (c + l)) * t.x + (u - h) * t.y + (d + m) * t.z), r((u + h) * t.x + (1 - (s + l)) * t.y + (f - p) * t.z), r((d - m) * t.x + (f + p) * t.y + (1 - (s + c)) * t.z));
}
function Gr(t, n, r) {
	let i = Math.fround, a = i(e.MathUtils.clamp(r, 0, 1)), o = i(t.x), s = i(t.y), c = i(t.z), l = i(t.w), u = i(n.x), d = i(n.y), f = i(n.z), p = i(n.w);
	i(i(i(i(o * u) + i(s * d)) + i(c * f)) + i(l * p)) < 0 && (u = -u, d = -d, f = -f, p = -p);
	let m = i(o + i(i(u - o) * a)), h = i(s + i(i(d - s) * a)), g = i(c + i(i(f - c) * a)), _ = i(l + i(i(p - l) * a)), v = i(Math.sqrt(i(i(i(i(m * m) + i(h * h)) + i(g * g)) + i(_ * _))));
	return v > 0 ? new e.Quaternion(i(m / v), i(h / v), i(g / v), i(_ / v)) : new e.Quaternion();
}
function Kr(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
//#endregion
//#region src/engine/utjSpringBoneRuntime.ts
var qr = /* @__PURE__ */ function(e) {
	return e[e.NoCollision = 0] = "NoCollision", e[e.HeadIsEmbedded = 1] = "HeadIsEmbedded", e[e.TailCollision = 2] = "TailCollision", e;
}({}), V = 1e-5, Jr = .001, Yr = new e.Vector3(1, 0, 0);
function Xr(t, n) {
	return {
		currTipPos: n.clone(),
		prevTipPos: n.clone(),
		hitNormal: new e.Vector3(0, 0, 0),
		cachedPosition: t.clone(),
		cachedMovement: new e.Vector3(0, 0, 0)
	};
}
function Zr(e) {
	let t = yi(e.parentRotation.clone().multiply(e.initialLocalRotation)), n = Wr(e.boneAxis, t);
	return H(n.multiplyScalar(Math.fround(e.springLength))), H(e.headPosition.clone().add(n));
}
function Qr(e, t) {
	let n = Math.fround;
	H(e.currTipPos), H(e.prevTipPos);
	let r = e.currTipPos.clone(), i = H(H(Zr(t).sub(e.currTipPos)).multiplyScalar(n(t.stiffnessForce))), a = H(H(H(t.springForce.clone().add(t.externalForce)).add(i)).multiplyScalar(n(.5 * n(t.deltaTime) * n(t.deltaTime)))), o = H(H(e.currTipPos.clone().sub(e.prevTipPos)).multiplyScalar(n(1 - n(t.dragForce))));
	H(e.currTipPos.add(H(a.add(o)))), e.prevTipPos.copy(r);
	let s = H(t.headPosition.clone()), c = H(e.currTipPos.clone().sub(s));
	Math.fround(c.length()) <= Jr && c.copy(t.lengthFallbackDirection ?? t.boneAxis), bi(c), H(c.multiplyScalar(n(t.springLength))), e.currTipPos.copy(H(c.add(s)));
}
function $r(e, t) {
	let n = H(t.clone());
	H(e.cachedMovement.copy(n).sub(e.cachedPosition)), e.cachedPosition.copy(n);
}
function ei(t, n, r, i, a, o = Yr) {
	let s = r.clone().sub(n), c = s.length();
	if (c <= Jr) {
		s.copy(o).normalize(), t.copy(n).addScaledVector(s, i);
		return;
	}
	let l = e.MathUtils.clamp(c, i, a);
	t.copy(n).addScaledVector(s, l / c);
}
function ti(t) {
	if (t.targets.length === 0) return;
	let n = t.springConstant * t.deltaTime * t.deltaTime, r = new e.Vector3();
	for (let e of t.targets) {
		let i = t.currTipPos.clone().sub(e.position), a = i.length();
		if (a <= V) continue;
		let o = a - e.initialLength;
		r.addScaledVector(i, -(n * o) / a);
	}
	t.currTipPos.add(r);
}
function ni(e, t) {
	let n = 0, r = null, i = e.currTipPos.clone();
	for (let i of Ti(t.colliders)) {
		if (i.enabled === !1) continue;
		let a = ai(i, t.headPosition, e.currTipPos, t.tailRadius, t.springLength);
		t.onColliderCheck?.(i, {
			status: a.status,
			beforeTailPosition: e.currTipPos.clone(),
			afterTailPosition: a.tailPosition.clone(),
			hitNormal: a.hitNormal.clone(),
			details: ri(i, t.headPosition, e.currTipPos, a.tailPosition, t.tailRadius)
		}), a.status !== 0 && (e.currTipPos.copy(a.tailPosition), e.hitNormal.copy(a.hitNormal), r = a.hitNormal, n = a.status, t.onCollision?.(i, a));
	}
	return r && gi(e, r, t.bounce, t.friction, i), n;
}
function ri(e, t, n, r, i) {
	return e.kind === "sphere" ? {
		kind: e.kind,
		localHeadPosition: t.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionBefore: n.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionAfter: r.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailRadius: i,
		localSphereOrigin: e.localOffset.clone(),
		localSphereRadius: Math.abs(e.lossyScaleX) * e.radius
	} : e.kind === "capsuleLocal" ? {
		kind: e.kind,
		localHeadPosition: t.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionBefore: n.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionAfter: r.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailRadius: i,
		localCapsuleStart: e.localStart.clone(),
		localCapsuleEnd: e.localEnd.clone(),
		capsuleRadius: e.radius
	} : e.kind === "panel" ? {
		kind: e.kind,
		localHeadPosition: t.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionBefore: n.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailPositionAfter: r.clone().applyMatrix4(e.worldToLocalMatrix),
		localTailRadius: i,
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
function ii(e, t) {
	let n = t.headPosition.clone();
	n.y -= t.groundHeight;
	let r = e.currTipPos.clone();
	return r.y -= t.groundHeight, si(n, e.currTipPos.distanceTo(t.headPosition), r, t.tailRadius, 1) === 0 ? !1 : (r.y += t.groundHeight, ei(e.currTipPos, t.headPosition, r, t.springLength * .5, t.springLength, t.lengthFallbackDirection), e.prevTipPos.copy(e.currTipPos), e.hitNormal.set(0, 1, 0), !0);
}
function ai(e, t, n, r, i) {
	return e.kind === "sphere" ? li(t, n, r, e) : e.kind === "capsule" ? ui(t, n, r, e.start, e.end, e.radius) : e.kind === "panel" ? oi(t, n, r, i, e) : di(t, n, r, e);
}
function oi(t, n, r, i, a) {
	let o = n.clone().applyMatrix4(a.worldToLocalMatrix), s = r;
	if (o.z >= s) return U(n);
	let c = a.width * .5, l = a.height * .5;
	if (Math.abs(o.x) >= c + s || Math.abs(o.y) >= l + s) return U(n);
	let u = t.clone().applyMatrix4(a.worldToLocalMatrix), d = i, f = 0, p = o.clone();
	if (o.z > 0 || u.z > 0) if (Math.abs(o.y) <= l && Math.abs(o.x) <= c) {
		if (f = si(u, d, p, s, 2), f === 0) return U(n);
	} else if (Math.abs(o.y) > l) {
		let t = o.y >= 0 ? l : -l, n = new e.Vector3(0, o.y - t, o.z);
		n.lengthSq() <= V * V ? n.set(0, 0, 0) : n.normalize(), p.set(o.x + n.x * s, t + n.y * s, n.z * s), f = 2;
	} else {
		let t = o.x >= 0 ? c : -c, n = new e.Vector3(o.x - t, 0, o.z);
		n.lengthSq() <= V * V ? n.set(0, 0, 0) : n.normalize(), p.set(t + n.x * s, o.y + n.y * s, n.z * s), f = 2;
	}
	else Math.abs(u.y) <= l ? Math.abs(u.x) <= c ? (f = 1, p.set(u.x, u.y, s)) : (f = 2, p.set(o.x < 0 ? -c : c, o.y, o.z)) : (f = 2, p.set(o.x, o.y >= 0 ? l : -l, o.z));
	return {
		status: f,
		tailPosition: p.applyMatrix4(a.localToWorldMatrix),
		hitNormal: Oi(new e.Vector3(0, 0, 1), a.localToWorldMatrix)
	};
}
function si(e, t, n, r, i) {
	if (W(n, i) >= r) return 0;
	let a = W(e, i);
	if (a + t <= r) return n.copy(e), ki(n, i, a + t), 1;
	let o = (i + 1) % 3, s = (i + 2) % 3, c = W(n, o) - W(e, o), l = W(n, s) - W(e, s), u = Math.sqrt(c * c + l * l);
	if (u > .001) {
		let d = a - r, f = Math.sqrt(t * t - d * d) / u;
		ki(n, o, W(e, o) + c * f), ki(n, s, W(e, s) + l * f), ki(n, i, r);
	} else n.copy(e);
	return 2;
}
function ci(t, n, r, i, a, o = a, s = {}) {
	let c = r + a, l = n.clone().sub(i);
	if (l.lengthSq() >= c * c) return U(n);
	if (t.distanceToSquared(i) <= o * o) {
		let n = s.headEmbeddedFallback === !1 ? l.clone().multiplyScalar(1 / Math.sqrt(l.lengthSq())) : Di(l, s.headEmbeddedFallback instanceof e.Vector3 ? s.headEmbeddedFallback : t.clone().sub(i).lengthSq() <= V * V ? new e.Vector3(0, 1, 0) : t.clone().sub(i));
		return {
			status: 1,
			tailPosition: i.clone().addScaledVector(n, c),
			hitNormal: n
		};
	}
	let u = mi(t, n.distanceTo(t), i, c);
	if (!u) return s.noIntersectionStatus === 2 ? {
		status: 2,
		tailPosition: n.clone(),
		hitNormal: Di(n.clone().sub(i), l)
	} : U(n);
	let d = hi(u, n);
	return {
		status: 2,
		tailPosition: d,
		hitNormal: Di(d.clone().sub(i), l)
	};
}
function li(e, t, n, r) {
	let i = e.clone().applyMatrix4(r.worldToLocalMatrix), a = t.clone().applyMatrix4(r.worldToLocalMatrix), o = n, s = Math.abs(r.lossyScaleX) * r.radius, c = ci(i, a, o, r.localOffset, s, s, {
		headEmbeddedFallback: !1,
		noIntersectionStatus: 2
	});
	return c.status === 0 ? U(t) : {
		status: c.status,
		tailPosition: c.tailPosition.clone().applyMatrix4(r.localToWorldMatrix),
		hitNormal: Oi(c.hitNormal.clone(), r.localToWorldNormalMatrix)
	};
}
function ui(t, n, r, i, a, o) {
	let s = a.clone().sub(i), c = s.lengthSq();
	if (c <= V * V) return ci(t, n, r, i, o);
	let l = e.MathUtils.clamp(n.clone().sub(i).dot(s) / c, 0, 1), u = i.clone().addScaledVector(s, l), d = r + o, f = n.clone().sub(u);
	if (f.lengthSq() >= d * d) return U(n);
	if (l <= V) return ci(t, n, r, i, o);
	if (l >= 1 - V) return ci(t, n, r, a, o);
	let p = Di(f, t.clone().sub(u)), m = e.MathUtils.clamp(t.clone().sub(i).dot(s) / c, 0, 1), h = i.clone().addScaledVector(s, m);
	return {
		status: t.distanceToSquared(h) <= o * o ? 1 : 2,
		tailPosition: u.addScaledVector(p, d),
		hitNormal: p
	};
}
function di(e, t, n, r) {
	let i = fi(e.clone().applyMatrix4(r.worldToLocalMatrix), t.clone().applyMatrix4(r.worldToLocalMatrix), n, r.localStart, r.localEnd, r.radius, r.lossyScaleX);
	if (i.status === 0) return U(t);
	let a = i.tailPosition.clone().applyMatrix4(r.localToWorldMatrix), o = Oi(i.hitNormal, r.localToWorldNormalMatrix);
	return {
		status: i.status,
		tailPosition: a,
		hitNormal: o
	};
}
function fi(t, n, r, i, a, o, s = 1) {
	if (o <= 1e-4) return U(n);
	let c = i.y <= a.y ? i : a, l = i.y <= a.y ? a : i, u = c.y, d = l.y;
	return n.y <= u || n.y >= d ? ci(t, n, r, n.y < d ? c : l, o, Math.abs(s) * o, {
		headEmbeddedFallback: new e.Vector3(0, 0, 0),
		noIntersectionStatus: 2
	}) : pi(t, n, r, o, s);
}
function pi(t, n, r, i, a = 1) {
	let o = i + r, s = n.x * n.x + n.z * n.z;
	if (s > o * o) return U(n);
	let c = Math.sqrt(s), l = c > V ? n.x / c : 0, u = c > V ? n.z / c : 0, d = new e.Vector3(o * l, n.y, o * u), f = new e.Vector3(l, 0, u), p = t.x * t.x + t.z * t.z, m = Math.abs(a) * i;
	return {
		status: p <= m * m ? 1 : 2,
		tailPosition: d,
		hitNormal: f
	};
}
function mi(e, t, n, r) {
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
function hi(e, t) {
	let n = t.clone().sub(e.origin), r = e.origin.clone().addScaledVector(e.upVector, n.dot(e.upVector)), i = t.clone().sub(r), a = i.length();
	return a <= V || e.radius <= V ? e.origin.clone() : e.origin.clone().addScaledVector(i, e.radius / a);
}
function gi(e, t, n, r, i = e.currTipPos) {
	let a = Di(t, Yr), o = e.prevTipPos.clone(), s = i.clone().sub(o), c = a.clone().multiplyScalar(s.dot(a)), l = s.sub(c).multiplyScalar(1 - r).sub(c.multiplyScalar(n));
	if (l.lengthSq() <= 1e-4) {
		e.prevTipPos.copy(e.currTipPos);
		return;
	}
	e.prevTipPos.copy(e.currTipPos).sub(l);
	let u = e.currTipPos.distanceTo(o), d = l.length(), f = Math.max(d - u, 0);
	f > 0 && e.currTipPos.addScaledVector(l, f / d);
}
function _i(e) {
	if (!e.limit.active) return !1;
	let t = Math.fround, n = e.vector, r = H(e.basisUp.clone()), i = H(e.basisSide.clone()), a = H(e.basisForward.clone());
	H(n);
	let o = t(r.dot(n)), s = H(r.multiplyScalar(o)), c = H(n.clone().sub(s)), l = t(c.length()), u = l <= V ? c.set(0, 0, 0) : c.set(t(c.x / l), t(c.y / l), t(c.z / l)), d = t(i.dot(u)), f = t(Math.asin(d < -1 ? -1 : Number.isNaN(d) ? 1 : Math.min(d, 1))) * t(180 / Math.PI), p = t(f - f * t(e.springStrength) * t(e.deltaTime) * t(e.deltaTime)), m = p <= e.limit.max ? p : e.limit.max, h = p < e.limit.min ? e.limit.min : m, g = h >= 0 ? e.limit.max : e.limit.min, _ = 0;
	if (g < -1e-4 || g > 1e-4) {
		let e = t(h / g);
		e >= 0 && (_ = Math.min(e, 1));
	}
	let v = t(g * _), y = t(g * _ * t(Math.PI / 180)), b = H(i.multiplyScalar(t(Math.sin(y))));
	return H(b.add(H(a.multiplyScalar(t(Math.cos(y)))))), H(b.multiplyScalar(l)), H(n.copy(s).add(b)), v !== p;
}
function vi(t, n, r, i, a) {
	let o = Math.fround, s = r.clone().multiply(i);
	yi(s);
	let c = Wr(new e.Vector3(o(o(n.x) - o(t.x)), o(o(n.y) - o(t.y)), o(o(n.z) - o(t.z))), s.invert());
	if (c.lengthSq() <= V * V) return i.clone();
	bi(c);
	let l = xi(a, c);
	return i.clone().multiply(l);
}
function H(e) {
	return e.set(Math.fround(e.x), Math.fround(e.y), Math.fround(e.z));
}
function yi(e) {
	return e.set(Math.fround(e.x), Math.fround(e.y), Math.fround(e.z), Math.fround(e.w));
}
function bi(e) {
	H(e);
	let t = Math.fround(e.length());
	return t > 1e-5 ? e.set(Math.fround(e.x / t), Math.fround(e.y / t), Math.fround(e.z / t)) : e.set(0, 0, 0);
}
function xi(t, n) {
	let r = Math.fround, i = wi(t.clone()), a = wi(n.clone()), o = Ci(i, a);
	if (i.lengthSq() === 0 || a.lengthSq() === 0 || o > .999999) return new e.Quaternion();
	let s = Array(9);
	if (o < -.999999) {
		let t = new e.Vector3(0, i.z, -i.y);
		Ci(t, t) < 1e-6 && t.set(-i.z, 0, i.x);
		let n = r(1 / r(Math.sqrt(Ci(t, t))));
		H(t.multiplyScalar(n));
		let a = Si(t, i), o = i.toArray(), c = t.toArray(), l = a.toArray();
		for (let e = 0; e < 3; e++) for (let t = 0; t < 3; t++) s[e * 3 + t] = r(r(r(l[t] * l[e]) - r(o[t] * o[e])) - r(c[t] * c[e]));
	} else {
		let e = Si(i, a), t = r(r(1 - o) / Ci(e, e)), n = r(e.x * t), c = r(e.y * t), l = r(e.z * t), u = r(e.y * n), d = r(e.z * n), f = r(e.y * l);
		s[0] = r(o + r(e.x * n)), s[1] = r(e.z + u), s[2] = r(d - e.y), s[3] = r(u - e.z), s[4] = r(o + r(c * e.y)), s[5] = r(e.x + f), s[6] = r(e.y + d), s[7] = r(f - e.x), s[8] = r(o + r(e.z * l));
	}
	let c = [
		0,
		0,
		0,
		0
	], l = r(r(s[0] + s[4]) + s[8]);
	if (l > 0) {
		let e = r(Math.sqrt(r(l + 1))), t = r(.5 / e);
		c[3] = r(e * .5), c[0] = r(r(s[5] - s[7]) * t), c[1] = r(r(s[6] - s[2]) * t), c[2] = r(r(s[1] - s[3]) * t);
	} else {
		let e = +(s[4] > s[0]);
		s[8] > s[e * 4] && (e = 2);
		let t = (e + 1) % 3, n = (t + 1) % 3, i = r(Math.sqrt(r(r(r(s[e * 4] - s[t * 4]) - s[n * 4]) + 1))), a = r(.5 / i);
		c[e] = r(i * .5), c[3] = r(r(s[t * 3 + n] - s[n * 3 + t]) * a), c[t] = r(r(s[e * 3 + t] + s[t * 3 + e]) * a), c[n] = r(r(s[e * 3 + n] + s[n * 3 + e]) * a);
	}
	let u = r(Math.sqrt(r(r(r(r(c[0] * c[0]) + r(c[1] * c[1])) + r(c[2] * c[2])) + r(c[3] * c[3]))));
	return new e.Quaternion(r(c[0] / u), r(c[1] / u), r(c[2] / u), r(c[3] / u));
}
function Si(t, n) {
	let r = Math.fround;
	return new e.Vector3(r(r(t.y * n.z) - r(t.z * n.y)), r(r(t.z * n.x) - r(t.x * n.z)), r(r(t.x * n.y) - r(t.y * n.x)));
}
function Ci(e, t) {
	let n = Math.fround;
	return n(n(n(e.x * t.x) + n(e.y * t.y)) + n(e.z * t.z));
}
function wi(e) {
	let t = Math.fround;
	e.set(t(e.x), t(e.y), t(e.z));
	let n = t(Math.sqrt(Ci(e, e)));
	return n >= Math.fround(1e-5) ? e.set(t(e.x / n), t(e.y / n), t(e.z / n)) : e.set(0, 0, 0);
}
function U(t) {
	return {
		status: 0,
		tailPosition: t.clone(),
		hitNormal: new e.Vector3(0, 0, 0)
	};
}
function Ti(e) {
	return [...e].sort((e, t) => Ei(e) - Ei(t));
}
function Ei(e) {
	return e.kind === "capsule" || e.kind === "capsuleLocal" ? 0 : e.kind === "sphere" ? 1 : 2;
}
function Di(e, t) {
	return e.lengthSq() <= V * V && e.copy(t), e.lengthSq() <= V * V && e.copy(Yr), e.normalize();
}
function Oi(e, t) {
	let n = t.elements, r = e.x, i = e.y, a = e.z;
	return e.set(n[0] * r + n[4] * i + n[8] * a, n[1] * r + n[5] * i + n[9] * a, n[2] * r + n[6] * i + n[10] * a), Di(e, Yr);
}
function W(e, t) {
	return t === 0 ? e.x : t === 1 ? e.y : e.z;
}
function ki(e, t, n) {
	t === 0 ? e.x = n : t === 1 ? e.y = n : e.z = n;
}
//#endregion
//#region src/engine/unityPrefabSpringRuntimeAdapter.ts
var Ai = 1401298464324817e-60, ji = Rr("right"), Mi = Rr("left"), Ni = Rr("back"), Pi = Rr("down"), Fi = class t {
	bones;
	managerBatches;
	missingNodes;
	skinnedBones;
	setupDiagnostics;
	externalForce = new e.Vector3(0, 0, 0);
	parentRotation = new e.Quaternion();
	headPosition = new e.Vector3();
	localRotation = new e.Quaternion();
	colliderLocalToWorld = new e.Matrix4();
	colliderWorldToLocal = new e.Matrix4();
	frameColliderCache = /* @__PURE__ */ new Map();
	angleVector = new e.Vector3();
	debugAnimatedTip = new e.Vector3();
	providerForce = new e.Vector3();
	providerRotation = new e.Quaternion();
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
	updateManagerPathId = null;
	traceEvents = [];
	constructor(e, t, n, r, i) {
		this.bones = e, this.managerBatches = t, this.missingNodes = n, this.skinnedBones = r, this.setupDiagnostics = i;
	}
	static fromPjskRuntimeExtension(e, n) {
		let r = Oa(e);
		if (!r) return null;
		n.updateMatrixWorld(!0);
		let i = $i(n), a = Qi(r), o = aa(n), s = [], c = da(r), l = Hi(r, i, s, c), u = sa(r), d = ca(r), f = la(r, l), p = oa(r), m = Wi(r), h = Ui(r, c, m), g = /* @__PURE__ */ new Map(), _ = /* @__PURE__ */ new Map(), v = /* @__PURE__ */ new Map(), y = /* @__PURE__ */ new Map();
		n.traverse((e) => y.set(e, y.size));
		let b = /* @__PURE__ */ new Map();
		for (let e of p.values()) b.set(e, ta(i, e.nodePath, e.runtimePartIndex));
		let x = (r.managers ?? []).filter((e) => fa(e.nodePath ?? e.poseRoot, c)).map((e) => ({
			source: e,
			node: ta(i, e.nodePath, e.runtimePartIndex),
			nodes: []
		})).sort((e, t) => (y.get(e.node) ?? 0) - (y.get(t.node) ?? 0));
		for (let e of x) {
			let t = e.source, n = Ri(i, t, v), o = e.node ? [...b].filter(([n, r]) => r ? $a(r, e.node) : n.pathId !== void 0 && t.bonePathIds?.includes(n.pathId)).sort((e, t) => (y.get(e[1]) ?? Infinity) - (y.get(t[1]) ?? Infinity)).map(([e]) => e) : (t.bonePathIds ?? []).map((e) => p.get(e));
			for (let p of o) {
				if (!p || !fa(p.nodePath, c)) continue;
				let o = p.pathId;
				if (!Ki(p, m)) {
					h.rejectedUnverifiedBoneSourceCount += 1;
					continue;
				}
				let v = b.get(p);
				if (!v) {
					s.push(p.nodePath ?? p.nodeName ?? `bone:${o}`);
					continue;
				}
				e.nodes.push(v), _.set(v, p);
				let y = Ji(p, v, a, i), x = ta(i, p.pivotNodePath, p.runtimePartIndex), S = qi(r, t, p, o === void 0 ? void 0 : u.get(o), o === void 0 ? void 0 : d.get(o), t.pathId === void 0 ? void 0 : f.get(t.pathId), l), C = Li(t, p, v, y, x, pa(i, p), n, S);
				C && g.set(v, C);
			}
		}
		let S = [...g.values()];
		S.sort((e, t) => Qa(e.node) - Qa(t.node));
		let C = x.map((e) => {
			let t = [...new Set(e.nodes)].map((e) => g.get(e)).sort((e, t) => Qa(e.node) - Qa(t.node));
			return {
				source: e.source,
				bones: t,
				animatedBones: new Set(t.filter((t) => Ta(_.get(t.node), t.node, e.source))),
				gravity: La(e.source.rawGravity),
				forceProviders: Ri(i, e.source, v),
				slowMotionScale: Y(e.source.slowMotionScale) ?? 1,
				isPaused: e.source.isPaused === !0
			};
		});
		return S.length > 0 ? new t(S, C, s, o, h) : null;
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
		for (let t of this.managerBatches) t.slowMotionScale = Ga(e.slowMotionScale, 1), t.isPaused = e.paused ?? !1;
		for (let t of this.bones) t.stiffnessForce = Ga(e.stiffnessForce, t.originalStiffnessForce), t.dragForce = Ga(e.dragForce, t.originalDragForce), t.windInfluence = Ga(e.windInfluence, t.originalWindInfluence), t.slowMotionScale = Ga(e.slowMotionScale, 1), t.isPaused = e.paused ?? !1;
	}
	clearTimelineControl() {
		this.setTimelineControl({});
	}
	update(t) {
		let n = this.collectWindVolumeOneSelfProviders(), r = new Set(n.filter((e) => e.isActive && e.springManagerPathId !== null).map((e) => e.springManagerPathId)), i = new Set(n.filter((e) => !e.isActive && e.springManagerPathId !== null).map((e) => e.springManagerPathId));
		for (let n of this.managerBatches) {
			let a = n.source;
			if (a.enabled === !1 || a.automaticUpdates === !1) continue;
			this.updateManagerPathId = Y(a.pathId), n.isPaused || this.preUpdateColliders(n.bones);
			let o = this.updateManagerPathId !== null && i.has(this.updateManagerPathId) ? !0 : a.isSumOfForcesOnBone !== !1;
			for (let i of n.bones) {
				if (!i.enabled) continue;
				z(i.node.parent, this.parentRotation), B(i.node, this.headPosition);
				let s = n.animatedBones.has(i) ? e.MathUtils.clamp(Y(a.dynamicRatio) ?? .5, 0, 1) : 1;
				if (n.isPaused) {
					i.skinAnimationLocalRotation.copy(i.node.quaternion), this.applyBoneRotation(i, s);
					continue;
				}
				!o || this.updateManagerPathId !== null && r.has(this.updateManagerPathId) || (this.computeExternalForce(i, t, n), this.updateBoneSpringAndRotation(i, Da(t, Y(a.simulationFrameRate) ?? 60, n.slowMotionScale), this.externalForce, s));
			}
		}
		for (let e of n) e.isActive && this.updateWindVolumeOneSelfLateUpdate(e, t);
	}
	collectWindVolumeOneSelfProviders() {
		let e = /* @__PURE__ */ new Set();
		for (let t of this.managerBatches) for (let n of t.forceProviders) n.kind === "WindVolumeOneSelf" && e.add(n);
		return [...e];
	}
	updateWindVolumeOneSelfLateUpdate(e, t) {
		if (e.springManagerPathId === null) return;
		let n = e.simulationFrameRate > 0 ? 1 / e.simulationFrameRate : t, r = this.managerBatches.find((t) => t.source.pathId === e.springManagerPathId);
		if (!(!r || r.source.enabled === !1 || r.source.automaticUpdates === !1 || r.isPaused)) {
			this.updateManagerPathId = e.springManagerPathId, this.preUpdateColliders(r.bones);
			for (let i of r.bones) i.enabled && (this.computeWindVolumeOneSelfForce(e, i, t), this.externalForce.copy(r.gravity).add(this.providerForce), this.updateBoneSpringAndRotation(i, n, this.externalForce, r.animatedBones.has(i) ? e.dynamicRatio : 1));
		}
	}
	computeExternalForce(e, t, n) {
		this.externalForce.copy(n.gravity);
		for (let r of n.forceProviders) this.externalForce.add(this.computeForceProvider(r, e, t));
		return this.externalForce;
	}
	computeForceProvider(e, t, n) {
		return e.kind === "ForceVolume" ? (e.node.updateMatrixWorld(!0), z(e.node, this.providerRotation), this.providerForce.set(0, 0, 1).applyQuaternion(this.providerRotation).multiplyScalar(e.strength)) : e.kind === "WindVolume" ? this.computeWindVolume(e, t) : this.computeWindVolumeOneSelfForce(e, t, n);
	}
	computeWindVolume(e, t) {
		let n = e.weight * e.strength;
		if (n <= Ai || e.period <= .001) return this.providerForce.set(0, 0, 0);
		e.node.updateMatrixWorld(!0), z(e.node, this.providerRotation), t.node.getWorldPosition(this.localBonePosition).applyMatrix4(this.providerWorldToLocal.copy(e.node.matrixWorld).invert());
		let r = -this.localBonePosition.x, i = Math.sin(e.timeFactor + Math.sin(r * e.positionalMultiplier) + Math.cos(this.localBonePosition.z * e.positionalMultiplier));
		return this.providerForce.set(0, 0, 1).applyQuaternion(this.providerRotation).addScaledVector(e.offsetVector, i).normalize().multiplyScalar(n * t.windInfluence);
	}
	computeWindVolumeOneSelfForce(t, n, r) {
		let i = t.weight * t.strength;
		if (i <= Ai || t.period <= Ai) return this.providerForce.set(0, 0, 0);
		t.currentTime = Wa(t.currentTime, r, t.period);
		let a = t.currentTime * Math.PI * 2 / t.period;
		if (t.node.updateMatrixWorld(!0), z(t.node, this.providerRotation), this.waveAxis.set(0, 1, 0).applyQuaternion(this.providerRotation), Math.abs(t.spinPeriod) > .001) {
			t.spinTime = Wa(t.spinTime, r, t.spinPeriod);
			let e = t.spinTime * Math.PI * 2 / t.spinPeriod;
			this.providerRight.copy(ji).applyQuaternion(this.providerRotation), this.providerUp.set(0, 1, 0).applyQuaternion(this.providerRotation), this.waveAxis.copy(this.providerRight).multiplyScalar(Math.cos(e)).addScaledVector(this.providerUp, Math.sin(e));
		}
		let o = Math.max(t.peakDistance, Ai);
		n.node.getWorldPosition(this.localBonePosition).applyMatrix4(this.providerWorldToLocal.copy(t.node.matrixWorld).invert());
		let s = Math.PI * 2 / o, c = -this.localBonePosition.x, l = Math.sin(a + Math.sin(s * c) + Math.cos(s * this.localBonePosition.z));
		return this.mainWindDirection.set(0, 0, 1).applyQuaternion(this.providerRotation).addScaledVector(this.waveAxis, t.amplitude * l).normalize(), this.additionalDirection.set(-Math.cos(e.MathUtils.degToRad(t.additionalWindAngle)), 0, -Math.sin(e.MathUtils.degToRad(t.additionalWindAngle))).normalize(), this.providerForce.copy(this.mainWindDirection).multiplyScalar(i).addScaledVector(this.additionalDirection, t.additionalWindStrength).multiplyScalar(n.windInfluence);
	}
	settleCurrentPose(e = 60, t = 1 / 60) {
		let n = Math.max(0, Math.floor(e));
		for (let e = 0; e < n; e += 1) this.update(t);
	}
	resetPose() {
		for (let e of this.bones) e.node.quaternion.copy(e.initialLocalRotation), e.skinAnimationLocalRotation.copy(e.initialLocalRotation), e.node.scale.copy(e.initialLocalScale), e.node.updateMatrix(), e.node.updateMatrixWorld(!0);
	}
	resetStateToCurrentPose() {
		for (let e of this.bones) z(e.node.parent, this.parentRotation), B(e.node, this.headPosition), e.skinAnimationLocalRotation.copy(e.node.quaternion), this.debugAnimatedTip.copy(Zr({
			headPosition: this.headPosition,
			parentRotation: this.parentRotation,
			initialLocalRotation: e.initialLocalRotation,
			boneAxis: e.boneAxis,
			springLength: e.springLength
		})), e.state.currTipPos.copy(this.debugAnimatedTip), e.state.prevTipPos.copy(this.debugAnimatedTip), e.state.cachedPosition.copy(this.headPosition), e.state.cachedMovement.set(0, 0, 0), e.state.hitNormal.set(0, 0, 0);
	}
	getSnapshot(t = !0, n = {}) {
		let r = /* @__PURE__ */ new Set(), i = [], a = [], o = 0, s = 0, c = 0, l = 0;
		for (let t of this.bones) {
			for (let e of t.colliders) r.add(e);
			z(t.node.parent, this.parentRotation), B(t.node, this.headPosition), this.debugAnimatedTip.copy(Zr({
				headPosition: this.headPosition,
				parentRotation: this.parentRotation,
				initialLocalRotation: t.initialLocalRotation,
				boneAxis: t.boneAxis,
				springLength: t.springLength
			}));
			let n = this.debugAnimatedTip.distanceTo(t.state.currTipPos), u = t.node.name.toLowerCase(), d = t.state.currTipPos.clone().sub(this.debugAnimatedTip), f = t.state.currTipPos.clone().sub(t.state.prevTipPos), p = this.skinnedBones.has(t.node);
			u.includes("sleeve") && (o = Math.max(o, n)), u.includes("skirt") && (s = Math.max(s, n)), p ? c += 1 : l += 1, i.push({
				name: t.node.name,
				path: X(t.node),
				springName: t.springName,
				sourceBoneName: t.sourceBoneName,
				sourceBonePath: t.sourceBonePath,
				sourceBonePathId: t.sourceBonePathId,
				resolvedIsSkinnedBone: p,
				pivotSourceName: t.pivotSourceName,
				pivotSourcePath: t.pivotSourcePath,
				pivotResolvedPath: t.pivotResolvedPath,
				tailBinding: Fa(t.tailBinding),
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
				dynamicRatio: wa(t),
				isAnimated: t.isAnimated,
				automaticUpdates: t.automaticUpdates,
				boneEnabled: t.enabled,
				bonePaused: t.isPaused,
				isSumOfForcesOnBone: t.isSumOfForcesOnBone,
				simulationFrameRate: t.simulationFrameRate,
				slowMotionScale: t.slowMotionScale,
				updateSkipReason: Aa(t),
				animatedTipDelta: G(d),
				velocity: G(f),
				springForce: G(t.springForce),
				colliderBindings: t.colliderBindingDiagnostics.map(ya)
			}), u.includes("skirt") && a.push({
				name: t.node.name,
				path: X(t.node),
				springName: t.springName,
				sourceBoneName: t.sourceBoneName,
				sourceBonePath: t.sourceBonePath,
				sourceBonePathId: t.sourceBonePathId,
				resolvedIsSkinnedBone: p,
				pivotSourceName: t.pivotSourceName,
				pivotSourcePath: t.pivotSourcePath,
				pivotResolvedPath: t.pivotResolvedPath,
				tailBinding: Fa(t.tailBinding),
				offset: n,
				appliedRotationDegrees: e.MathUtils.radToDeg(t.skinAnimationLocalRotation.clone().normalize().angleTo(t.node.quaternion.clone().normalize())),
				colliderCount: t.colliders.length,
				lastCollisionStatus: t.lastCollisionStatus,
				lastCollisionColliderName: t.lastCollisionInfo?.name ?? null,
				lastCollisionColliderPath: t.lastCollisionInfo?.path ?? null,
				lastCollisionColliderKind: t.lastCollisionInfo?.kind ?? null,
				lastCollisionColliderSourcePathId: t.lastCollisionInfo?.sourcePathId ?? null,
				lastCollisionHitNormal: t.lastCollisionInfo ? G(t.lastCollisionInfo.hitNormal) : null,
				lastAngleLimitApplied: t.lastAngleLimitApplied,
				hasSpringForce: t.springForce.lengthSq() > 1e-8,
				forceProviderCount: t.forceProviders.length,
				stiffnessForce: t.stiffnessForce,
				dragForce: t.dragForce,
				managerDynamicRatio: t.dynamicRatio,
				dynamicRatio: wa(t),
				isAnimated: t.isAnimated,
				automaticUpdates: t.automaticUpdates,
				boneEnabled: t.enabled,
				bonePaused: t.isPaused,
				isSumOfForcesOnBone: t.isSumOfForcesOnBone,
				simulationFrameRate: t.simulationFrameRate,
				slowMotionScale: t.slowMotionScale,
				updateSkipReason: Aa(t),
				animatedTipDelta: G(d),
				velocity: G(f),
				headMovement: G(t.state.cachedMovement),
				gravity: G(t.gravity),
				springForce: G(t.springForce),
				colliderBindings: t.colliderBindingDiagnostics.map(ya)
			});
		}
		i.sort((e, t) => t.offset - e.offset), a.sort((e, t) => t.offset - e.offset);
		let u = ka(i, n), d = Ii(this.bones, this.skinnedBones);
		return {
			runtimeMode: "unity-prefab",
			enabled: t,
			springCount: this.managerBatches.length,
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
			bindingDiagnostics: this.bones.flatMap((e) => e.colliderBindingDiagnostics).map(ya),
			skinnedBoneMatches: c,
			skinnedBoneMisses: l
		};
	}
	updateBoneSpringAndRotation(t, n, r, i) {
		z(t.node.parent, this.parentRotation), B(t.node, this.headPosition);
		let a = this.shouldTraceBone(t) ? this.createTraceEvent(t, n, r, i) : null;
		t.skinAnimationLocalRotation.copy(t.node.quaternion), a && (a.skinAnimationLocalRotation = Ma(t.skinAnimationLocalRotation)), $r(t.state, this.headPosition), a && (a.stateAfterCache = K(t.state)), Qr(t.state, {
			headPosition: this.headPosition,
			parentRotation: this.parentRotation,
			initialLocalRotation: t.initialLocalRotation,
			boneAxis: t.boneAxis,
			lengthFallbackDirection: t.boneAxis.clone().applyQuaternion(z(t.node, new e.Quaternion())),
			springLength: t.springLength,
			stiffnessForce: t.stiffnessForce,
			dragForce: t.dragForce,
			springForce: t.springForce,
			externalForce: r,
			deltaTime: n
		}), a && (a.stateAfterUpdateSpring = K(t.state)), this.applyLengthLimits(t, n), a && (a.stateAfterLengthLimits = K(t.state));
		let o = Math.abs(t.radius);
		a && (a.tailRadius = o);
		let s = t.collideWithGround ? ii(t.state, {
			headPosition: this.headPosition,
			springLength: t.springLength,
			tailRadius: o,
			groundHeight: t.groundHeight,
			lengthFallbackDirection: t.boneAxis.clone().applyQuaternion(z(t.node, new e.Quaternion())),
			bounce: t.bounce,
			friction: t.friction
		}) : !1;
		a && (a.groundHit = s, a.stateAfterGround = K(t.state)), t.lastCollisionInfo = null;
		let c = [], l = t.enableCollision ? this.buildWorldColliders(t.colliders) : [];
		t.lastCollisionStatus = !s && t.enableCollision ? ni(t.state, {
			headPosition: this.headPosition,
			springLength: t.springLength,
			tailRadius: o,
			colliders: l,
			bounce: t.bounce,
			friction: t.friction,
			onColliderCheck: a ? (e, t) => {
				c.push(Pa(e, t));
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
		}) : 0, a && (a.collisionChecks = c, a.collisionStatus = t.lastCollisionStatus, a.stateAfterCollisions = K(t.state));
		let u = a ? Na(t) : void 0;
		t.lastAngleLimitApplied = t.enableAngleLimits ? this.applyAngleLimits(t, n, u) : !1, a && u && (a.angleLimit = u, a.stateAfterAngleLimits = K(t.state)), this.resetInvalidTipPosition(t), this.applyBoneRotation(t, i), a && (a.finalLocalRotation = Ma(t.node.quaternion), this.pushTraceEvent(a));
	}
	applyLengthLimits(t, n) {
		if (!t.enableLengthLimits || t.lengthLimitTargets.length === 0) return;
		let r = t.lengthLimitTargets.map((t) => ({
			position: B(t.node, new e.Vector3()),
			initialLength: t.initialLength
		}));
		ti({
			currTipPos: t.state.currTipPos,
			springConstant: t.springConstant,
			deltaTime: n,
			targets: r
		});
	}
	applyAngleLimits(e, t, n) {
		if (!e.yAngleLimit && !e.zAngleLimit) return !1;
		let r = e.pivotNode ?? e.node.parent ?? e.node;
		r.updateMatrixWorld(!0), this.angleVector.copy(e.state.currTipPos).sub(e.state.cachedPosition), this.angleVector.set(Math.fround(this.angleVector.x), Math.fround(this.angleVector.y), Math.fround(this.angleVector.z));
		let i = Ur(r, Mi.clone()), a = Ur(r, Ni.clone()), o = Ur(r, Pi.clone());
		n && (n.enabled = !0, n.hasPivot = !0, n.pivotName = r.name || null, n.pivotPath = X(r) || null, n.vectorBefore = G(this.angleVector), n.forward = G(i), n.back = G(a), n.down = G(o));
		let s = !1;
		if (e.yAngleLimit) {
			let r = _i({
				basisSide: o,
				basisUp: a,
				basisForward: i,
				springStrength: e.angularStiffness,
				deltaTime: t,
				limit: e.yAngleLimit,
				vector: this.angleVector
			});
			n && (n.yApplied = r, n.afterY = G(this.angleVector)), s = r || s;
		}
		if (e.zAngleLimit) {
			let r = _i({
				basisSide: a,
				basisUp: o,
				basisForward: i,
				springStrength: e.angularStiffness,
				deltaTime: t,
				limit: e.zAngleLimit,
				vector: this.angleVector
			});
			n && (n.zApplied = r, n.afterZ = G(this.angleVector)), s = r || s;
		}
		return e.state.currTipPos.copy(e.state.cachedPosition).add(this.angleVector), e.state.currTipPos.set(Math.fround(e.state.currTipPos.x), Math.fround(e.state.currTipPos.y), Math.fround(e.state.currTipPos.z)), n && (n.vectorAfter = G(this.angleVector)), s;
	}
	applyBoneRotation(e, t = e.dynamicRatio) {
		this.resetInvalidTipPosition(e), this.localRotation.copy(vi(this.headPosition, e.state.currTipPos, this.parentRotation, e.initialLocalRotation, e.boneAxis)), e.node.quaternion.copy(Pr(Gr(e.skinAnimationLocalRotation, this.localRotation, t))), e.node.updateMatrix(), e.node.updateMatrixWorld(!0);
	}
	resetInvalidTipPosition(e) {
		Number.isFinite(e.state.currTipPos.x) && Number.isFinite(e.state.currTipPos.y) && Number.isFinite(e.state.currTipPos.z) || (this.debugAnimatedTip.copy(Zr({
			headPosition: this.headPosition,
			parentRotation: this.parentRotation,
			initialLocalRotation: e.initialLocalRotation,
			boneAxis: e.boneAxis,
			springLength: e.springLength
		})), e.state.currTipPos.copy(this.debugAnimatedTip), e.state.prevTipPos.copy(this.debugAnimatedTip));
	}
	shouldTraceBone(e) {
		if (this.traceFilters.length === 0) return !1;
		let t = e.node.name.toLowerCase(), n = X(e.node).toLowerCase(), r = e.springName.toLowerCase();
		return this.traceFilters.some((e) => t.includes(e) || n.includes(e) || r.includes(e));
	}
	createTraceEvent(e, t, n, r) {
		return {
			sequence: this.traceSequence,
			springName: e.springName,
			boneName: e.node.name,
			bonePath: X(e.node),
			sourceBoneName: e.sourceBoneName,
			sourceBonePath: e.sourceBonePath,
			sourceBonePathId: e.sourceBonePathId,
			pivotSourceName: e.pivotSourceName,
			pivotSourcePath: e.pivotSourcePath,
			pivotResolvedPath: e.pivotResolvedPath,
			tailBinding: Fa(e.tailBinding),
			managerPathId: e.managerPathId,
			updateManagerPathId: this.updateManagerPathId,
			deltaTime: t,
			dynamicRatio: r,
			automaticUpdates: e.automaticUpdates,
			enabled: e.enabled,
			enableCollision: e.enableCollision,
			enableAngleLimits: e.enableAngleLimits,
			enableLengthLimits: e.enableLengthLimits,
			colliderCount: e.colliders.length,
			forceProviderCount: e.forceProviders.length,
			headPosition: G(this.headPosition),
			parentRotation: Ma(this.parentRotation),
			initialLocalRotation: Ma(e.initialLocalRotation),
			skinAnimationLocalRotation: Ma(e.skinAnimationLocalRotation),
			boneAxis: G(e.boneAxis),
			boneAxisSource: e.boneAxisSource,
			springLength: e.springLength,
			radius: e.radius,
			tailRadius: 0,
			stiffnessForce: e.stiffnessForce,
			dragForce: e.dragForce,
			springForce: G(e.springForce),
			gravity: G(e.gravity),
			externalForce: G(n),
			stateBefore: K(e.state),
			stateAfterCache: K(e.state),
			animatedTip: G(Zr({
				headPosition: this.headPosition,
				parentRotation: this.parentRotation,
				initialLocalRotation: e.initialLocalRotation,
				boneAxis: e.boneAxis,
				springLength: e.springLength
			})),
			stateAfterUpdateSpring: K(e.state),
			stateAfterLengthLimits: K(e.state),
			groundHit: !1,
			stateAfterGround: K(e.state),
			collisionStatus: 0,
			collisionChecks: [],
			stateAfterCollisions: K(e.state),
			angleLimit: Na(e),
			stateAfterAngleLimits: K(e.state),
			finalLocalRotation: Ma(e.node.quaternion)
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
	preUpdateColliders(e = this.bones) {
		this.frameColliderCache.clear();
		let t = /* @__PURE__ */ new Set();
		for (let n of e) for (let e of n.colliders) t.add(e);
		let n = [...t].sort((e, t) => Ya(e.source) - Ya(t.source));
		for (let e of n) {
			let t = this.createWorldCollider(e);
			t && this.frameColliderCache.set(e, t);
		}
	}
	createWorldCollider(t) {
		let n = t.source.shape, r = t.source.enabled !== !1, i = r && t.source.linkedRendererEnabled !== !1;
		return n?.sphere ? (t.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(t.node.matrixWorld), this.colliderWorldToLocal.copy(t.node.matrixWorld).invert(), {
			kind: "sphere",
			enabled: r,
			debugName: t.source.nodeName ?? t.source.scriptName ?? t.node.name,
			debugPath: t.source.nodePath ?? X(t.node),
			debugSourcePathId: t.source.pathId,
			localOffset: La(n.sphere.offset),
			radius: Math.max(0, n.sphere.radius ?? .01),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Za(this.colliderWorldToLocal),
			localToWorldNormalMatrix: new e.Matrix4().makeRotationFromQuaternion(z(t.node, new e.Quaternion())),
			lossyScaleX: Xa(t.node)
		}) : n?.capsule ? (t.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(t.node.matrixWorld), this.colliderWorldToLocal.copy(t.node.matrixWorld).invert(), {
			kind: "capsuleLocal",
			enabled: i,
			debugName: t.source.nodeName ?? t.source.scriptName ?? t.node.name,
			debugPath: t.source.nodePath ?? X(t.node),
			debugSourcePathId: t.source.pathId,
			localStart: La(n.capsule.offset),
			localEnd: La(n.capsule.tail),
			radius: Math.max(0, n.capsule.radius ?? .01),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Za(this.colliderWorldToLocal),
			localToWorldNormalMatrix: new e.Matrix4().makeRotationFromQuaternion(z(t.node, new e.Quaternion())),
			lossyScaleX: Xa(t.node)
		}) : n?.panel ? (t.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(t.node.matrixWorld), this.colliderWorldToLocal.copy(t.node.matrixWorld).invert(), {
			kind: "panel",
			enabled: i,
			debugName: t.source.nodeName ?? t.source.scriptName ?? t.node.name,
			debugPath: t.source.nodePath ?? X(t.node),
			debugSourcePathId: t.source.pathId,
			width: Math.max(0, n.panel.width ?? 0),
			height: Math.max(0, n.panel.height ?? 0),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Za(this.colliderWorldToLocal),
			worldToLocalLengthScale: Za(this.colliderWorldToLocal),
			localToWorldNormalMatrix: new e.Matrix4().makeRotationFromQuaternion(z(t.node, new e.Quaternion()))
		}) : null;
	}
};
function Ii(e, t) {
	let n = /* @__PURE__ */ new Map(), r = [];
	for (let i of e) {
		let e = Ia(i.sourceBonePath), a = `${i.runtimePartIndex ?? "null"}|${i.runtimePartType ?? "null"}|${e ?? "null"}`, o = n.get(a);
		o || (o = {
			runtimePartIndex: i.runtimePartIndex,
			runtimePartType: i.runtimePartType,
			sourceRoot: e,
			count: 0,
			sampleNames: [],
			samplePaths: []
		}, n.set(a, o)), o.count += 1, o.sampleNames.length < 6 && (o.sampleNames.push(i.node.name), o.samplePaths.push(X(i.node))), r.length < 12 && (i.runtimePartType === "hair" || i.node.name.toLowerCase().includes("hair") || (i.sourceBonePath ?? "").toLowerCase().includes("hair")) && r.push({
			name: i.node.name,
			path: X(i.node),
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
function Li(t, n, r, i, a, o, s, c) {
	let l = i.tailPosition, u = B(r, new e.Vector3()), d = l.clone().sub(u);
	d.set(Math.fround(d.x), Math.fround(d.y), Math.fround(d.z));
	let f = Math.fround(d.length()), p = r.quaternion.clone(), m = Ra(r, l), h = e.MathUtils.clamp(Y(t.dynamicRatio) ?? .5, 0, 1), g = o.map((t) => ({
		node: t.node,
		initialLength: B(t.node, new e.Vector3()).distanceTo(l)
	})), _ = n.rawStiffnessForce ?? 300, v = n.rawDragForce ?? n.dragForce ?? .4, y = Math.max(0, n.rawWindInfluence ?? 1), b = Y(t.slowMotionScale) ?? 1, x = t.isPaused === !0;
	return {
		managerPathId: Y(t.pathId),
		runtimePartIndex: Y(n.runtimePartIndex) ?? Y(t.runtimePartIndex),
		runtimePartType: n.runtimePartType ?? t.runtimePartType ?? n.partKind ?? t.partKind ?? null,
		springName: `${t.partKind ?? n.partKind ?? "Part"}:${t.nodeName ?? t.pathId ?? "manager"}`,
		sourceBoneName: n.nodeName ?? null,
		sourceBonePath: n.nodePath ?? null,
		sourceBonePathId: Y(n.pathId),
		pivotSourceName: n.pivotNodeName ?? null,
		pivotSourcePath: n.pivotNodePath ?? null,
		pivotResolvedPath: a ? X(a) : null,
		tailBinding: i,
		automaticUpdates: t.automaticUpdates !== !1,
		enabled: n.enabled !== !1,
		enableLengthLimits: t.enableLengthLimits !== !1,
		enableAngleLimits: t.enableAngleLimits !== !1,
		enableCollision: t.enableCollision !== !1,
		collideWithGround: t.collideWithGround === !0,
		groundHeight: t.groundHeight ?? 0,
		isSumOfForcesOnBone: t.isSumOfForcesOnBone !== !1,
		isPaused: x,
		gravity: La(t.rawGravity),
		forceProviders: s,
		node: r,
		state: Xr(u, l),
		initialLocalRotation: p,
		initialLocalScale: r.scale.clone(),
		skinAnimationLocalRotation: p.clone(),
		boneAxis: m.axis,
		boneAxisSource: m.source,
		springLength: f,
		dynamicRatio: h,
		isAnimated: Ta(n, r, t),
		simulationFrameRate: Y(t.simulationFrameRate) ?? 60,
		slowMotionScale: b,
		bounce: Y(t.bounce) ?? 0,
		friction: Y(t.friction) ?? 1,
		radius: Math.max(0, n.hitRadius ?? .05),
		stiffnessForce: _,
		dragForce: v,
		windInfluence: y,
		originalStiffnessForce: _,
		originalDragForce: v,
		originalWindInfluence: y,
		springForce: La(n.rawSpringForce),
		springConstant: n.rawSpringConstant ?? .5,
		lengthLimitTargets: g,
		angularStiffness: Math.max(0, n.rawAngularStiffness ?? 100),
		pivotNode: a,
		yAngleLimit: Ca(n.rawAngleLimits?.y),
		zAngleLimit: Ca(n.rawAngleLimits?.z),
		colliders: c.colliders,
		colliderBindingDiagnostics: c.diagnostics,
		lastCollisionStatus: 0,
		lastCollisionInfo: null,
		lastAngleLimitApplied: !1
	};
}
function Ri(e, t, n) {
	return (t.forceProviders ?? []).map((t) => {
		let r = zi(t), i = r ? n.get(r) : void 0;
		if (i) return i;
		let a = Bi(e, t);
		return a && r && n.set(r, a), a;
	}).filter((e) => !!e);
}
function zi(e) {
	let t = typeof e.runtimePartIndex == "number" ? `${e.runtimePartIndex}:` : "";
	return typeof e.sourcePathId == "number" ? `${t}path:${e.sourcePathId}` : e.nodePath ? `${t}nodePath:${e.nodePath}` : null;
}
function Bi(t, n) {
	let r = n.scriptName ?? "", i = r.endsWith("WindVolumeOneSelf"), a = r.endsWith("WindVolume") && !i, o = r.endsWith("ForceVolume") && !a;
	if (!o && !a && !i) return null;
	let s = ta(t, n.nodePath, n.runtimePartIndex) ?? Vi(t, n.nodeName), c = n.raw ?? {};
	if (!s || !Va(c, "m_Enabled", !0) || n.activeSelf === !1 || n.activeInHierarchy === !1) return null;
	let l = {
		sourcePathId: Y(n.sourcePathId),
		node: s,
		springManagerPathId: Y(n.springManagerPathId) ?? Ha(c, "<SpringManager>k__BackingField") ?? Ha(c, "_SpringManager_k__BackingField") ?? Ha(c, "springManager")
	};
	return o ? {
		kind: "ForceVolume",
		...l,
		strength: J(c, "strength", 0)
	} : a ? {
		kind: "WindVolume",
		...l,
		weight: J(c, "weight", 0),
		strength: J(c, "strength", 0),
		period: J(c, "period", 0),
		positionalMultiplier: J(c, "positionalMultiplier", 0),
		timeFactor: J(c, "timeFactor", 0),
		offsetVector: Ba(c, "offsetVector")
	} : {
		kind: "WindVolumeOneSelf",
		...l,
		isActive: Va(c, "isActive", !1),
		dynamicRatio: e.MathUtils.clamp(J(c, "dynamicRatio", .5), 0, 1),
		simulationFrameRate: Math.max(0, J(c, "simulationFrameRate", 60)),
		weight: J(c, "weight", 0),
		strength: J(c, "strength", 0),
		period: J(c, "period", 0),
		currentTime: J(c, "currentTime", 0),
		spinPeriod: J(c, "spinPeriod", 0),
		spinTime: J(c, "spinTime", 0),
		amplitude: J(c, "amplitude", 0),
		peakDistance: J(c, "peakDistance", 0),
		additionalWindAngle: J(c, "additionalWindAngle", 0),
		additionalWindStrength: J(c, "additionalWindStrength", 0)
	};
}
function Vi(e, t) {
	if (!t) return null;
	let n = [...new Set(e.nodeByPath.values())].filter((e) => e.name === t);
	return n.length === 1 ? n[0] : null;
}
function Hi(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let a of e.colliders ?? []) {
		if (typeof a.index != "number" || !fa(a.nodePath, r)) continue;
		let e = ta(t, a.nodePath, a.runtimePartIndex);
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
function Ui(e, t, n) {
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
function Wi(e) {
	let t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), r = !1;
	for (let i of e.prefabGraphs ?? []) {
		Array.isArray(i.monoBehaviours) && (r = !0);
		for (let e of i.monoBehaviours ?? []) Gi(e.scriptName) && (typeof e.pathId == "number" && t.add(e.pathId), e.transformPath && n.add(ra(e.runtimePartIndex ?? -1, e.transformPath)));
	}
	return {
		hasComponentMetadata: r,
		pathIds: t,
		partPaths: n
	};
}
function Gi(e) {
	let t = e?.trim().toLowerCase();
	return t === "springbone" || t === "sekaispringbone";
}
function Ki(e, t) {
	return !t.hasComponentMetadata || typeof e.pathId == "number" && t.pathIds.has(e.pathId) ? !0 : !!(e.nodePath && t.partPaths.has(ra(e.runtimePartIndex ?? -1, e.nodePath)));
}
function qi(e, t, n, r, i, a, o) {
	if (!r && !i) return {
		colliders: [],
		diagnostics: a ? [va(t, n, r, i, null, null, null, `no per-bone collider binding; manager cache not used as fallback; ${Sa(a)}`, [])] : []
	};
	let s = i?.sourceKind ?? r?.sourceKind ?? "direct", c = ma(i?.candidateRoots ?? r?.collidersByRoot, o);
	if (s === "colliderFlag" && c.size > 0) {
		let o = ga(c, a), s = _a(e, t, n, i, r, o), l = s.root ? o.get(s.root) ?? [] : [];
		return {
			colliders: l,
			diagnostics: [va(t, n, r, i, c, i?.defaultRoot ?? r?.defaultRoot, s.root, `${s.reason}; manager cache constrained; ${Sa(a)}`, l)]
		};
	}
	let l = ba((i?.selectedColliderIndexes ?? r?.colliders ?? []).map((e) => o.get(e)).filter((e) => !!e), t, n);
	return {
		colliders: l,
		diagnostics: [va(t, n, r, i, null, i?.defaultRoot ?? r?.defaultRoot, null, `${i?.selectedColliderIndexes ? "bindingDecision.selectedColliderIndexes" : r?.colliders ? "colliderBinding.colliders" : "no direct collider indexes"} / direct serialized collider references / pose root preference; ${Sa(a)}`, l)]
	};
}
function Ji(t, n, r, i) {
	n.updateMatrixWorld(!0);
	let a = B(n, new e.Vector3()), o = Ur(n, Rr("right")), s = Math.fround, c = new e.Vector3(s(a.x - s(o.x * s(.1))), s(a.y - s(o.y * s(.1))), s(a.z - s(o.z * s(.1)))), l = t.nodePath ? na(r, t.nodePath, t.runtimePartIndex) : void 0, u = l ? Xi(l, r, i, t.runtimePartIndex) : [], d = u.map((e) => e.source.name ?? e.node.name), f = u.map((e) => e.source.transformPath ?? X(e.node));
	if (u.length === 0) return {
		mode: "fallback",
		childCount: 0,
		childNames: d,
		childPaths: f,
		childSources: [],
		tailPosition: c
	};
	if (u.length === 1) return {
		mode: "singleChild",
		childCount: 1,
		childNames: d,
		childPaths: f,
		childSources: u.map((e) => e.source),
		tailPosition: B(u[0].node, new e.Vector3())
	};
	let p = new e.Vector3(), m = 0;
	for (let t of u) {
		let n = B(t.node, new e.Vector3());
		p.add(n), p.set(s(p.x), s(p.y), s(p.z));
		let r = n.clone().sub(a);
		r.set(s(r.x), s(r.y), s(r.z)), m = s(m + s(r.length()));
	}
	p.set(s(p.x / u.length), s(p.y / u.length), s(p.z / u.length)), m = s(m / u.length);
	let h = Yi(a, p, m);
	return {
		mode: "averageChildren",
		childCount: u.length,
		childNames: d,
		childPaths: f,
		childSources: u.map((e) => e.source),
		tailPosition: h
	};
}
function Yi(t, n, r) {
	let i = Math.fround, a = n.clone().sub(t);
	if (a.set(i(a.x), i(a.y), i(a.z)), a.lengthSq() <= 1e-5 * 1e-5) a.copy(ji);
	else {
		let e = i(a.length());
		a.set(i(a.x / e), i(a.y / e), i(a.z / e));
	}
	return new e.Vector3(i(t.x + i(a.x * i(r))), i(t.y + i(a.y * i(r))), i(t.z + i(a.z * i(r))));
}
function Xi(e, t, n, r) {
	let i = [];
	for (let a of e.childPathIds ?? []) {
		let e = t.transformByPathId.get(a);
		if (!e || !Zi(e, t)) continue;
		let o = ta(n, e.transformPath, r ?? e.runtimePartIndex);
		o && i.push({
			source: e,
			node: o
		});
	}
	return i;
}
function Zi(e, t) {
	return typeof e.pathId == "number" && t.pivotTransformPathIds.has(e.pathId) ? !1 : !e.transformPath || !t.pivotTransformPaths.has(e.transformPath);
}
function Qi(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
	for (let i of e.prefabGraphs ?? []) for (let e of i.transforms ?? []) typeof e.pathId == "number" && t.set(e.pathId, e), e.transformPath && (n.set(e.transformPath, e), typeof e.runtimePartIndex == "number" && r.set(ra(e.runtimePartIndex, e.transformPath), e));
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
function $i(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
	return e.traverse((i) => {
		let a = X(i, e);
		if (!a) return;
		t.set(a, i);
		let o = qa(i, e);
		o && o !== a && r.set(o, i);
		let s = ia(i), c = i.userData.pjskTransformPath;
		for (let e of typeof c == "string" && c.length > 0 ? [c] : []) typeof s == "number" && n.set(ra(s, e), i), t.has(e) || t.set(e, i);
	}), {
		nodeByPath: t,
		nodeByPartPath: n,
		canonicalNodeByPath: r
	};
}
function ea(e, t) {
	return t ? e.nodeByPath.get(t) ?? e.canonicalNodeByPath.get(t) ?? null : null;
}
function ta(e, t, n) {
	if (!t) return null;
	if (typeof n == "number") {
		let r = e.nodeByPartPath.get(ra(n, t));
		if (r) return r;
	}
	return ea(e, t);
}
function na(e, t, n) {
	return typeof n == "number" ? e.transformByPartPath.get(ra(n, t)) ?? e.transformByPath.get(t) : e.transformByPath.get(t);
}
function ra(e, t) {
	return `${e}:${t}`;
}
function ia(e) {
	let t = e.userData.pjskRuntimePartIndex;
	return typeof t == "number" ? t : void 0;
}
function aa(e) {
	let t = /* @__PURE__ */ new Set();
	return e.traverse((e) => {
		let n = e;
		if (n.isSkinnedMesh) for (let e of n.skeleton.bones) t.add(e);
	}), t;
}
function oa(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.bones ?? []) typeof n.pathId == "number" && t.set(n.pathId, n);
	return t;
}
function sa(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.colliderBindings ?? []) typeof n.sourceSpringBonePathId == "number" && t.set(n.sourceSpringBonePathId, n);
	return t;
}
function ca(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.bindingDecisions ?? []) typeof n.sourceSpringBonePathId == "number" && t.set(n.sourceSpringBonePathId, n);
	return t;
}
function la(e, t) {
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
			typeof n == "number" && i && ua(r, i) && e.add(n);
		}
		n.set(r.managerPathId, {
			source: r,
			colliderIndexes: e
		});
	}
	return n;
}
function ua(e, t) {
	let n = e.managerNodePath ?? "", r = t.source.nodePath ?? "", i = t.source.shape;
	return n.endsWith("/Position/PositionOffset/Hip") ? i?.sphere ? /\/(?:Left_Thigh|Right_Thigh)\/CL_/.test(r) || /\/Hip\/CL_HipSphereCollider$/.test(r) : !1 : !0;
}
function da(e) {
	return new Set((e.activeRootProfile?.activeRoots ?? []).map((e) => q(e)).filter((e) => !!e));
}
function fa(e, t) {
	if (t.size === 0) return !0;
	let n = q(Ia(e));
	return n !== null && t.has(n);
}
function pa(e, t) {
	let n = [];
	for (let r of t.lengthLimitTargets ?? []) {
		let i = ta(e, r.nodePath, r.runtimePartIndex ?? t.runtimePartIndex);
		i && n.push({
			node: i,
			initialLength: 0
		});
	}
	return n;
}
function ma(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let [r, i] of Object.entries(e ?? {})) {
		let e = i.map((e) => t.get(e)).filter((e) => !!e);
		e.length > 0 && n.set(r, e);
	}
	return n;
}
function ha(e, t) {
	return !t || t.colliderIndexes.size === 0 ? e : e.filter((e) => typeof e.source.index == "number" && t.colliderIndexes.has(e.source.index));
}
function ga(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let [r, i] of e.entries()) {
		let e = ha(i, t);
		e.length > 0 && n.set(r, e);
	}
	return n;
}
function _a(e, t, n, r, i, a) {
	if (a.size === 1) return {
		root: a.keys().next().value,
		reason: "single manager-cache root"
	};
	let o = q(Ia(n.nodePath));
	if (o && a.has(o)) return {
		root: o,
		reason: "joint root matched candidate root"
	};
	if (t.partKind === "Head" || o === "face") {
		let t = q(e.rootSelectionProfile?.defaultBodyRoot ?? e.activeRootProfile?.defaultBodyRoot);
		if (t && a.has(t)) return {
			root: t,
			reason: "head/face uses runtime defaultBodyRoot"
		};
		if (a.has("body")) return {
			root: "body",
			reason: "head/face body fallback"
		};
	}
	let s = q(r?.defaultRoot);
	if (s && a.has(s)) return {
		root: s,
		reason: "bindingDecision.defaultRoot"
	};
	for (let t of e.activeRootProfile?.activeRoots ?? []) {
		let e = q(t);
		if (e && a.has(e)) return {
			root: e,
			reason: "activeRootProfile active root"
		};
	}
	let c = q(i?.defaultRoot);
	return c && a.has(c) ? {
		root: c,
		reason: "binding.defaultRoot"
	} : {
		root: null,
		reason: c ? `binding.defaultRoot ${c} not available after manager cache` : "no matching root"
	};
}
function va(e, t, n, r, i, a, o, s, c) {
	return {
		sourceKind: r?.sourceKind ?? n?.sourceKind ?? "direct",
		colliderFlag: r?.colliderFlag ?? n?.colliderFlag ?? null,
		colliderGroupIndex: null,
		springName: `${e.partKind ?? t.partKind ?? "Part"}:${e.nodeName ?? e.pathId ?? "manager"}`,
		boneName: t.nodeName ?? null,
		bonePath: t.nodePath ?? null,
		sourceSpringBonePathId: Y(t.pathId),
		candidateRoots: i ? [...i.entries()].map(([e, t]) => ({
			root: e,
			colliderCount: t.length,
			colliderSourcePathIds: t.map((e) => e.source.pathId).filter((e) => typeof e == "number")
		})) : [],
		defaultRoot: q(a),
		selectedRoot: o,
		selectedColliderCount: c.length,
		selectedColliderSourcePathIds: c.map((e) => e.source.pathId).filter((e) => typeof e == "number"),
		selectionReason: s
	};
}
function ya(e) {
	return {
		...e,
		candidateRoots: e.candidateRoots.map((e) => ({
			...e,
			colliderSourcePathIds: [...e.colliderSourcePathIds]
		})),
		selectedColliderSourcePathIds: [...e.selectedColliderSourcePathIds]
	};
}
function ba(e, t, n) {
	let r = xa(t, n);
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
function xa(e, t) {
	return t.nodePath?.startsWith("sit_body/") ? "sit_body/" : t.nodePath?.startsWith("body/") || e.partKind === "Head" || t.nodePath?.startsWith("face/") ? "body/" : null;
}
function Sa(e) {
	return e ? `${e.source.managerNodeName ?? "manager"} manager cache (${e.source.sphereColliderIndexes?.length ?? 0} sphere, ${e.source.capsuleColliderIndexes?.length ?? 0} capsule, ${e.source.panelColliderIndexes?.length ?? 0} panel)` : "no manager cache available";
}
function Ca(e) {
	return e?.active ? {
		active: !0,
		min: e.min ?? 0,
		max: e.max ?? 0
	} : null;
}
function wa(e) {
	return e.isAnimated ? e.dynamicRatio : 1;
}
function Ta(e, t, n) {
	let r = Ea(n.animatedBoneNames);
	return r.size === 0 ? !1 : r.has(t.name) || typeof e.nodeName == "string" && r.has(e.nodeName);
}
function Ea(e) {
	return Array.isArray(e) ? new Set(e.filter((e) => typeof e == "string")) : /* @__PURE__ */ new Set();
}
function Da(e, t, n) {
	let r = t > 0 ? 1 / t : e;
	return n === 1 ? r : r * n;
}
function Oa(e) {
	let t = Ka(Ka(Ka(e)?.pjskSpringBone)?.runtimeUnitySetup), n = t?.version;
	return n === "0414" || n === 414 ? t : null;
}
function G(e) {
	return {
		x: e.x,
		y: e.y,
		z: e.z,
		length: e.length()
	};
}
function ka(e, t) {
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
function Aa(e) {
	return e.automaticUpdates ? e.enabled ? e.isPaused ? "isPaused=true" : e.isSumOfForcesOnBone ? null : "isSumOfForcesOnBone=false" : "enabled=false" : "automaticUpdates=false";
}
function ja(e) {
	return e ? G(e) : null;
}
function Ma(e) {
	return {
		x: e.x,
		y: e.y,
		z: e.z,
		w: e.w
	};
}
function K(e) {
	return {
		currTipPos: G(e.currTipPos),
		prevTipPos: G(e.prevTipPos),
		hitNormal: G(e.hitNormal),
		cachedPosition: G(e.cachedPosition),
		cachedMovement: G(e.cachedMovement)
	};
}
function Na(e) {
	return {
		enabled: e.enableAngleLimits,
		hasPivot: !!e.pivotNode,
		pivotName: e.pivotNode?.name || null,
		pivotPath: e.pivotNode && X(e.pivotNode) || null,
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
function Pa(e, t) {
	return {
		kind: e.kind,
		name: e.debugName ?? null,
		path: e.debugPath ?? null,
		sourcePathId: e.debugSourcePathId ?? null,
		enabled: e.enabled !== !1,
		status: t.status,
		beforeTailPosition: G(t.beforeTailPosition),
		afterTailPosition: G(t.afterTailPosition),
		hitNormal: G(t.hitNormal),
		localHeadPosition: ja(t.details.localHeadPosition),
		localTailPositionBefore: ja(t.details.localTailPositionBefore),
		localTailPositionAfter: ja(t.details.localTailPositionAfter),
		localTailRadius: t.details.localTailRadius ?? null,
		localSphereOrigin: ja(t.details.localSphereOrigin),
		localSphereRadius: t.details.localSphereRadius ?? null,
		localCapsuleStart: ja(t.details.localCapsuleStart),
		localCapsuleEnd: ja(t.details.localCapsuleEnd),
		capsuleRadius: t.details.capsuleRadius ?? null,
		panelWidth: t.details.panelWidth ?? null,
		panelHeight: t.details.panelHeight ?? null
	};
}
function Fa(e) {
	return {
		mode: e.mode,
		childCount: e.childCount,
		childNames: [...e.childNames],
		childPaths: [...e.childPaths],
		tailPosition: G(e.tailPosition)
	};
}
function Ia(e) {
	if (!e) return null;
	let t = e.indexOf("/");
	return t < 0 ? e : e.slice(0, t);
}
function q(e) {
	return e ? e.endsWith("/") ? e.slice(0, -1) : e : null;
}
function La(t) {
	return Ir(Array.isArray(t) ? new e.Vector3(t[0] ?? 0, t[1] ?? 0, t[2] ?? 0) : Mr(t, new e.Vector3()));
}
function Ra(e, t) {
	e.updateMatrixWorld(!0);
	let n = za(Br(e, t.clone()));
	return n ? {
		axis: n,
		source: "computed-local-tip"
	} : {
		axis: ji.clone(),
		source: "fallback-local-tip"
	};
}
function za(t) {
	let n = Math.fround(t.length());
	return n <= 1e-5 ? null : new e.Vector3(Math.fround(t.x / n), Math.fround(t.y / n), Math.fround(t.z / n));
}
function J(e, t, n) {
	return Y(e[t] ?? e[Ua(t)]) ?? n;
}
function Ba(t, n) {
	let r = t[n] ?? t[Ua(n)];
	return Array.isArray(r) || typeof r == "object" && r ? La(r) : new e.Vector3();
}
function Va(e, t, n) {
	let r = e[t] ?? e[Ua(t)];
	return typeof r == "boolean" ? r : typeof r == "number" ? r !== 0 : n;
}
function Ha(e, t) {
	let n = Ka(e[t] ?? e[Ua(t)]);
	return Y(n?.m_PathID ?? n?.m_pathID ?? n?.pathId);
}
function Ua(e) {
	return e.length > 0 ? e[0].toUpperCase() + e.slice(1) : e;
}
function Wa(t, n, r) {
	return r > 0 ? e.MathUtils.euclideanModulo(t + n, r) : t + n;
}
function Ga(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function Y(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function Ka(e) {
	return e && typeof e == "object" ? e : null;
}
function X(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(r.name), r = r.parent;
	return n.join("/");
}
function qa(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(Ja(r.name)), r = r.parent;
	return n.join("/");
}
function Ja(e) {
	return e.replace(/_([1-9]\d*)$/, "");
}
function Ya(e) {
	return e.shape?.sphere ? 0 : e.shape?.capsule ? 1 : 2;
}
function Xa(t) {
	return t.getWorldScale(new e.Vector3()).x;
}
function Za(e) {
	let t = e.elements;
	return Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]);
}
function Qa(e) {
	let t = 0, n = e;
	for (; n;) t += 1, n = n.parent;
	return t;
}
function $a(e, t) {
	for (let n = e; n; n = n.parent) if (n === t) return !0;
	return !1;
}
//#endregion
//#region src/engine/prefabNodeLookup.ts
function eo(e) {
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
var to = 7, no = class {
	graph;
	setup;
	constraints;
	constructor(e, t, n) {
		this.graph = e, this.setup = t, e.root.updateMatrixWorld(!0);
		let r = Array.isArray(t.constraints) ? t.constraints : [];
		this.constraints = r.map((t) => ao(e, t, n));
	}
	update() {
		this.graph.root.updateMatrixWorld(!0);
		let e = this.constraints.map(oo);
		return this.graph.root.updateMatrixWorld(!0), io(this.setup, e);
	}
};
function ro(e, t, n) {
	if (!t) return null;
	let r = Array.isArray(t.constraints) ? t.constraints : [];
	e.root.updateMatrixWorld(!0);
	let i = r.map((t) => ao(e, t, n)).map(oo);
	return e.root.updateMatrixWorld(!0), io(t, i);
}
function io(e, t) {
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
function ao(e, t, n) {
	let r = Po(t.type) ?? "unknown", i = Po(t.ownerPath), a = Po(t.ownerName), o = fo(e, i, a), s = fo(e, Po(t.worldUpObjectPath), Po(t.worldUpObjectName)).node, c = (Array.isArray(t.sources) ? t.sources : []).map((t) => co(e, t, n, r !== "position"));
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
function oo(e) {
	let { source: t, type: n, ownerPath: r, ownerName: i, owner: a, worldUpObject: o, sources: s, sourceDebug: c } = e, l = (e, t) => ({
		type: n,
		status: e,
		reason: t,
		ownerPath: r,
		ownerName: i,
		resolvedOwner: !!a.node,
		applied: !1,
		sources: c
	});
	if (t.enabled === !1 || t.active === !1) return l("skipped", "constraint component is disabled");
	if (!a.node) return l("unresolved", a.reason);
	if (s.length === 0) return l("unresolved", "constraint has no source transforms");
	let u = s.find((e) => !e.node);
	if (u) return l("unresolved", u.debug.sourceName ? `source transform ${u.debug.sourceName} was not uniquely resolved` : "constraint source transform was not resolved");
	let d = s.filter(uo);
	return n === "parent" ? To(a.node, d, t) ? so(n, r, i, c, "parent constraint applied with height-scaled translation offsets") : l("skipped", "parent constraint has no positive source weight") : n === "rotation" ? Do(a.node, d, t) ? so(n, r, i, c, "rotation constraint applied with weighted source rotations") : l("skipped", "rotation constraint has no positive source weight") : n === "position" ? Eo(a.node, d, t) ? so(n, r, i, c, "position constraint applied in the parent space") : l("skipped", "position constraint has no positive source weight") : n === "aim" ? Oo(a.node, d, t, o) ? so(n, r, i, c, "aim constraint applied with exported aim/up vectors") : l("skipped", "aim constraint target direction or source weight was invalid") : l("skipped", `unsupported constraint type ${n}`);
}
function so(e, t, n, r, i) {
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
function co(e, t, n, r) {
	let i = Po(t.sourcePath), a = Po(t.sourceName), o = r ? lo(e, i, a) : fo(e, i, null), s = Fo(t.weight) ?? 1, c = Mo(t.translationOffset, n), l = No(t.rotationOffset);
	return {
		node: o.node,
		weight: s,
		translationOffset: c,
		rotationOffset: l,
		debug: {
			sourcePath: i,
			sourceName: a,
			weight: s,
			resolvedSource: !!o.node,
			translationOffset: c ? {
				x: c.x,
				y: c.y,
				z: c.z
			} : null,
			rotationOffset: l ? {
				x: l.x,
				y: l.y,
				z: l.z
			} : null
		}
	};
}
function lo(e, t, n) {
	if (n) {
		let t = null;
		if (e.root.traverse((e) => {
			!t && e.name === n && (t = e);
		}), t) return {
			node: t,
			reason: "rebound by transform name in the combined model"
		};
	}
	return fo(e, t, n);
}
function uo(e) {
	return !!e.node;
}
function fo(e, t, n) {
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
var po = (t) => new e.Vector3(-t.x, t.y, t.z), mo = (t) => new e.Quaternion(t.x, -t.y, -t.z, t.w), ho = po, go = mo;
function _o(t) {
	return t.updateMatrixWorld(!0), po(t.getWorldPosition(new e.Vector3()));
}
function vo(t) {
	return mo(z(t, new e.Quaternion()));
}
function yo(t) {
	return new e.Quaternion().setFromEuler(new e.Euler(e.MathUtils.degToRad(t.x), e.MathUtils.degToRad(t.y), e.MathUtils.degToRad(t.z), "YXZ"));
}
function bo(t) {
	let n = new e.Euler().setFromQuaternion(t, "YXZ");
	return new e.Vector3(e.MathUtils.radToDeg(n.x), e.MathUtils.radToDeg(n.y), e.MathUtils.radToDeg(n.z));
}
function xo(t, n) {
	let r = t.clone().normalize(), i = new e.Vector3().crossVectors(n, r);
	if (i.lengthSq() < 1e-12) return new e.Quaternion().setFromUnitVectors(new e.Vector3(0, 0, 1), r);
	i = i.normalize();
	let a = new e.Vector3().crossVectors(r, i);
	return new e.Quaternion().setFromRotationMatrix(new e.Matrix4().makeBasis(i, a, r));
}
function So(t, n) {
	let r = t.reduce((e, t) => e + Math.max(0, t.weight), 0);
	if (r <= 0) return null;
	let i = new e.Vector3();
	for (let e of t) {
		let t = Math.max(0, e.weight);
		if (t <= 0) continue;
		let a = _o(e.node);
		n && a.add(n(e, vo(e.node))), i.addScaledVector(a, t / r);
	}
	return i;
}
function Co(e, t) {
	let n = null, r = 0;
	for (let i of e) {
		let e = Math.max(0, i.weight);
		e <= 0 || (n = jo(n, t(i), r, e), r += e);
	}
	return n;
}
function wo(t, n, r, i, a = null) {
	let o = e.MathUtils.clamp(Fo(n.weight) ?? 1, 0, 1), s = vo(t.parent);
	if (i) {
		let r = s.clone().invert().multiply(i).normalize(), a = Fo(n.rotationAxis) ?? to, c = n.rotationAtRest ? Ao(n.rotationAtRest) : bo(mo(t.quaternion)), l = bo(r), u = yo(new e.Vector3(ko(a, 1) ? l.x : c.x, ko(a, 2) ? l.y : c.y, ko(a, 4) ? l.z : c.z)), d = yo(c).slerp(u, o).normalize();
		t.quaternion.copy(go(d));
	}
	if (r && t.parent) {
		t.parent.updateMatrixWorld(!0);
		let i = po(t.parent.worldToLocal(ho(r)));
		a && i.add(a);
		let s = Fo(n.translationAxis) ?? to, c = n.translationAtRest ? Ao(n.translationAtRest) : po(t.position), l = new e.Vector3(ko(s, 1) ? i.x : c.x, ko(s, 2) ? i.y : c.y, ko(s, 4) ? i.z : c.z);
		t.position.copy(ho(c.clone().lerp(l, o)));
	}
	t.updateMatrix(), t.updateMatrixWorld(!0);
}
function To(t, n, r) {
	let i = So(n, (t, n) => t.translationOffset ? po(t.translationOffset).applyQuaternion(n) : new e.Vector3()), a = Co(n, (t) => vo(t.node).multiply(t.rotationOffset ? yo(t.rotationOffset) : new e.Quaternion()));
	return !i || !a ? !1 : (wo(t, r, i, a), !0);
}
function Eo(t, n, r) {
	let i = So(n);
	return i ? (wo(t, r, i, null, r.translationOffset ? Ao(r.translationOffset) : new e.Vector3()), !0) : !1;
}
function Do(e, t, n) {
	let r = Co(t, (e) => vo(e.node));
	if (!r) return !1;
	let i = No(n.rotationOffset);
	return i && r.multiply(yo(i)), wo(e, n, null, r), !0;
}
function Oo(t, n, r, i) {
	let a = So(n);
	if (!a) return !1;
	let o = _o(t), s = a.clone().sub(o);
	if (s.lengthSq() < 1e-12) return !1;
	let c = Ao(r.aimVector ?? {
		x: 0,
		y: 0,
		z: 1
	}), l = Ao(r.upVector ?? {
		x: 0,
		y: 1,
		z: 0
	}), u = Ao(r.worldUpVector ?? {
		x: 0,
		y: 1,
		z: 0
	}), d;
	switch (Fo(r.worldUpType) ?? 0) {
		case 1:
			d = i ? _o(i).sub(o) : new e.Vector3(0, 1, 0);
			break;
		case 2:
			d = i ? u.clone().applyQuaternion(vo(i)) : u.clone();
			break;
		case 3:
			d = u.clone();
			break;
		case 4:
			d = null;
			break;
		default: d = new e.Vector3(0, 1, 0);
	}
	let f = d ? xo(s, d).multiply(xo(c, l).invert()) : new e.Quaternion().setFromUnitVectors(c.clone().normalize(), s.clone().normalize()), p = No(r.rotationOffset);
	return p && f.multiply(yo(p)), wo(t, r, null, f.normalize()), !0;
}
function ko(e, t) {
	return (e & t) !== 0;
}
function Ao(t) {
	return Mr(t, new e.Vector3());
}
function jo(e, t, n, r) {
	if (!e) return t.clone();
	let i = t.clone();
	return e.dot(i) < 0 && i.set(-i.x, -i.y, -i.z, -i.w), e.slerp(i, r / (n + r)).normalize();
}
function Mo(t, n) {
	return !t || typeof t != "object" ? null : Fr(Mr(t, new e.Vector3())).multiplyScalar(n);
}
function No(t) {
	return !t || typeof t != "object" ? null : Mr(t, new e.Vector3());
}
function Po(e) {
	return typeof e == "string" ? e : null;
}
function Fo(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
//#endregion
//#region src/engine/unityPrefabRuntime.ts
function Io(e, t) {
	let n = t, r = e.nodeByPath.get("body/Position");
	if (!r) throw Error("Official CharacterModel PositionNote 'body/Position' was not found.");
	return r.scale.setScalar(n), r.updateMatrix(), e.root.updateMatrixWorld(!0), r;
}
function Lo(e) {
	return e && typeof e == "object" ? e : {};
}
function Z(e) {
	let t = Lo(Lo(Lo(e).pjskSpringBone).runtimeUnitySetup);
	return t.version === "0414" ? t : null;
}
function Ro(e) {
	let t = Lo(Lo(e).nativeMeshes);
	return t.version === "0414" ? t : null;
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
function zo(e) {
	return e?.parentingMode === "model_combine_setup";
}
function Bo(e, t) {
	e.parent && e.parent.remove(e), t.add(e), e.updateMatrix();
}
function Vo(e, t) {
	for (; e.children.length > 0;) Bo(e.children[0], t);
}
function Ho(e, t, n) {
	let r = [], i = /* @__PURE__ */ new Set();
	for (let a of t) {
		let t = e.get(a);
		t && !i.has(t) && (Bo(t, n), i.add(t), r.push(a));
	}
	return r;
}
function Uo(e, t, n) {
	e.parent && e.parent.remove(e);
	let r = /* @__PURE__ */ new Set();
	e.traverse((e) => {
		e.userData.pjskModelCombineDestroyed = !0, r.add(e);
	});
	for (let [e, n] of t.entries()) r.has(n) && t.delete(e);
	for (let [e, t] of n.entries()) r.has(t) && n.delete(e);
}
function Wo(e, t, n) {
	for (let [r, i] of e.entries()) i === t && e.set(r, n);
}
function Go(e, t, n, r, i) {
	let a = r.childMoveSuffix ?? "_target", o = r.parentRootPath, s = r.childRootPath, c = Q(t, [r.parentCombineNodeAPath ?? r.parentAttachPath]), l = Q(t, [r.parentCombineNodeBPath]), u = Q(t, [r.childCombineNodeAPath ?? r.childOriginPath]), d = Q(t, [r.childCombineNodeBPath]), f = Q(t, [s]);
	if (!o || !s || !c || !l || !u || !d || !f) throw Error("Official model_combine_setup paths were not fully resolved.");
	Vo(l.node, d.node);
	let p = c.node.parent, m = u.node.parent;
	if (p && m) {
		for (let e of [...p.children]) e.name.endsWith(a) && Bo(e, m);
		let e = Ho(t, i, t.get(o) ?? p), n = i.filter((t) => !e.includes(t));
		if (n.length > 0) throw Error(`Official model_combine_setup head renderers were not moved: ${n.join(", ")}.`);
		let c = `${s}/${r.faceRendererName ?? "Face"}`;
		if (!e.includes(c)) throw Error(`Official model_combine_setup face renderer '${c}' was not moved.`);
		Bo(u.node, p);
	}
	return u.node.position.copy(c.node.position), u.node.quaternion.copy(c.node.quaternion), u.node.scale.copy(c.node.scale), u.node.updateMatrix(), d.node.position.copy(l.node.position), d.node.quaternion.copy(l.node.quaternion), d.node.scale.copy(l.node.scale), d.node.updateMatrix(), Wo(n, c.node, u.node), Wo(n, l.node, d.node), Uo(l.node, t, n), Uo(c.node, t, n), Uo(f.node, t, n), t.set(c.path, u.node), t.set(l.path, d.node), r.parentAttachPath && t.set(r.parentAttachPath, u.node), r.parentCombineNodeBPath && t.set(r.parentCombineNodeBPath, d.node), e.updateMatrixWorld(!0), {
		bodyNodeA: c,
		bodyNodeB: l,
		faceNodeA: u,
		faceNodeB: d
	};
}
function Ko(e, t) {
	return [...new Set((Z(e)?.prefabGraphs ?? []).flatMap((e) => e.renderers ?? []).filter((e) => e.typeName === "SkinnedMeshRenderer").map((e) => e.transformPath).filter((e) => !!(e && e.startsWith(`${t}/`))))];
}
function qo(e, t) {
	let n = Z(e), r = n?.bodyHeadAssembly?.childRootPath, i = t.rendererTransformPath;
	if (!r || !i?.startsWith(`${r}/`)) return !1;
	let a = (n.prefabGraphs ?? []).flatMap((e) => e.renderers ?? []).filter((e) => e.transformPath === i);
	return a.length > 0 && a.every((e) => e.typeName !== "SkinnedMeshRenderer");
}
function Jo(e, t) {
	return (Ro(e)?.meshes ?? []).find((e) => e.rendererTransformPath?.startsWith(`${t}/`) && typeof e.rootBonePath == "string")?.rootBonePath ?? null;
}
function Yo(e, t) {
	let n = e, r = /* @__PURE__ */ new Set();
	for (; typeof n.parentPathId == "number";) {
		if (typeof n.pathId == "number" && !r.add(n.pathId)) throw Error(`Runtime prefab graph contains a parent cycle at PathID ${n.pathId}.`);
		let e = t.get(n.parentPathId);
		if (!e) break;
		n = e;
	}
	return n;
}
function Xo(e) {
	let t = e.transformPath?.split("/")[0];
	return t ? `${e.runtimePartIndex ?? -1}:${t}` : null;
}
function Zo(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of Ro(e)?.meshes ?? []) {
		if (typeof r.rendererTransformPathId != "number") continue;
		let e = t.get(r.rendererTransformPathId);
		if (!e) continue;
		let i = Yo(e, t), a = Xo(e);
		if (!a || typeof i.pathId != "number") continue;
		let o = n.get(a);
		if (o !== void 0 && o !== i.pathId) throw Error(`Runtime native meshes reference multiple Unity prefab instances for '${a}' (${o}, ${i.pathId}).`);
		n.set(a, i.pathId);
	}
	return n;
}
function Qo(t, n) {
	let r = n.prefabGraphs ?? [], i = new e.Group();
	i.name = "UnityPrefabSourceRoot", i.userData.pjskUnityPrefabSourceGraph = !0;
	let a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map();
	for (let e of r) for (let t of e.transforms ?? []) typeof t.pathId != "number" || !t.transformPath || (o.set(t.pathId, t), c.set(t.transformPath, (c.get(t.transformPath) ?? 0) + 1));
	let l = new Set([...c.entries()].filter(([, e]) => e > 1).map(([e]) => e)), u = Zo(t, o);
	for (let t of r) for (let n of t.transforms ?? []) {
		if (typeof n.pathId != "number" || !n.transformPath) continue;
		let t = new e.Object3D();
		t.name = n.name ?? n.transformPath.split("/").pop() ?? `path_${n.pathId}`, t.userData.pjskTransformPath = n.transformPath, t.userData.pjskRuntimePartIndex = n.runtimePartIndex, t.userData.pjskPoseRoot = n.poseRoot ?? null, t.position.copy(Fr(Mr(n.localPosition, new e.Vector3()))), t.quaternion.copy(Lr(Nr(n.localRotation))), t.scale.copy(Mr(n.localScale, new e.Vector3(1, 1, 1))), t.updateMatrix(), a.set(n.pathId, t);
		let r = Yo(n, o), i = u.get(Xo(n) ?? "");
		(i === void 0 || i === r.pathId || !s.has(n.transformPath)) && s.set(n.transformPath, t);
	}
	for (let [e, t] of a.entries()) {
		let n = o.get(e)?.parentPathId;
		((typeof n == "number" ? a.get(n) : null) ?? i).add(t);
	}
	return i.updateMatrixWorld(!0), {
		root: i,
		nodeByPath: s,
		nodeByPathId: a,
		ambiguousPaths: l
	};
}
function $o(e, t) {
	let n = Z(e);
	if (!n?.prefabGraphs?.length) return null;
	let { root: r, nodeByPath: i, nodeByPathId: a, ambiguousPaths: o } = Qo(e, n);
	r.updateMatrixWorld(!0);
	let s = ts(r), c = n.bodyHeadAssembly;
	if (!zo(c)) throw Error("Runtime package must provide the official model_combine_setup body/head assembly.");
	let l = Q(i, [c.parentAttachPath]), u = Q(i, [c.childRootPath]), d = Q(i, [c.childOriginPath]);
	if (!l || !u || !d) throw Error("Official model_combine_setup body/head roots were not fully resolved.");
	let f = Ko(e, u.path), p = Go(r, i, a, c, f), m = Jo(e, l.path.split("/")[0]), h = m ? i.get(m) ?? null : null, g = ts(r), _ = s - g, v = [];
	if (t) {
		let e = eo(t);
		for (let [t, n] of i.entries()) {
			let r = e.get(t);
			r && v.push({
				source: n,
				target: r
			});
		}
	}
	let y = {
		active: !0,
		sourcePath: p.bodyNodeA.path,
		targetPath: p.faceNodeA.path,
		reason: null,
		setupVersion: String(n.version ?? ""),
		mountedHeadRootCount: 1,
		mountedHeadOriginPaths: [p.faceNodeA.path],
		assemblyCounts: {
			inputTransforms: s,
			retainedTransforms: g,
			removedTransforms: _,
			capturedCommonRemovedTransforms: 14,
			removedAtLeastCapturedCommonCount: _ >= 14
		},
		targetCount: v.length,
		targetPaths: v.slice(0, 24).map((e) => String(e.source.userData.pjskTransformPath ?? e.source.name)),
		keyNodes: {
			runtimeMount: null,
			modelCombineBodyNeck: gs(p.bodyNodeA.node, r),
			modelCombineFaceNeck: gs(p.faceNodeA.node, r)
		}
	};
	return {
		root: r,
		nodeByPath: i,
		nodeByPathId: a,
		ambiguousPaths: o,
		meshCarrierBindings: v,
		bodyAttach: p.faceNodeA.node,
		bodyAttachPath: l.path,
		headRoot: p.faceNodeA.node,
		headRootPath: p.faceNodeA.path,
		headOrigin: p.faceNodeA.node,
		headOriginPath: p.faceNodeA.path,
		bodyRootBone: h,
		bodyRootBonePath: m,
		headRendererPaths: f,
		debug: y
	};
}
function es(e) {
	let t = Z(e);
	if (!t?.prefabGraphs?.length) return null;
	let { root: n, nodeByPath: r, nodeByPathId: i, ambiguousPaths: a } = Qo(e, t), o = ts(n);
	return {
		root: n,
		nodeByPath: r,
		nodeByPathId: i,
		ambiguousPaths: a,
		meshCarrierBindings: [],
		bodyAttach: null,
		bodyAttachPath: null,
		headRoot: null,
		headRootPath: null,
		headOrigin: null,
		headOriginPath: null,
		bodyRootBone: null,
		bodyRootBonePath: null,
		headRendererPaths: [],
		debug: {
			active: !1,
			sourcePath: null,
			targetPath: null,
			reason: "single part prefab (no model_combine_setup)",
			setupVersion: String(t.version ?? ""),
			mountedHeadRootCount: 0,
			mountedHeadOriginPaths: [],
			assemblyCounts: {
				inputTransforms: o,
				retainedTransforms: o,
				removedTransforms: 0,
				capturedCommonRemovedTransforms: 0,
				removedAtLeastCapturedCommonCount: !1
			},
			targetCount: 0,
			targetPaths: [],
			keyNodes: {
				runtimeMount: null,
				modelCombineBodyNeck: null,
				modelCombineFaceNeck: null
			}
		}
	};
}
function ts(e) {
	let t = 0;
	return e.traverse((n) => {
		n !== e && (t += 1);
	}), t;
}
function ns(t, n) {
	let r = Ro(n), i = r?.meshes ?? [];
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
	for (let r of i) {
		if (qo(n, r)) continue;
		let i = r.rendererTransformPath, u = r.bonePaths ?? [], d = r.bonePathIds ?? [], f = [
			...typeof r.rendererTransformPathId == "number" ? [] : [i],
			...d.length === 0 ? u : [],
			...typeof r.rootBonePathId == "number" ? [] : [r.rootBonePath]
		].filter((e) => !!(e && t.ambiguousPaths.has(e)));
		if (f.length > 0) {
			let e = `Native mesh '${r.meshPath ?? r.meshName ?? "<unnamed>"}' has an ambiguous legacy PathID-less skin binding (${[...new Set(f)].join(", ")}); regenerate it with a current Haruki-3D-Exporter.`;
			c.push(e), l.push(e);
			continue;
		}
		if (d.length > 0 && d.length !== u.length) {
			let e = `Native mesh '${r.meshPath ?? r.meshName ?? "<unnamed>"}' has ${u.length} bone paths but ${d.length} bone PathIDs; regenerate it with a current Haruki-3D-Exporter.`;
			c.push(e), l.push(e);
			continue;
		}
		let p = typeof r.rendererTransformPathId == "number" ? t.nodeByPathId.get(r.rendererTransformPathId) : i ? t.nodeByPath.get(i) : null;
		if (!p) {
			let e = `Native mesh '${r.meshPath ?? r.meshName ?? "<unnamed>"}' skipped: renderer transform '${i ?? "<null>"}' was not found.`;
			c.push(e), l.push(e);
			continue;
		}
		let m = os(r);
		if (!m) {
			let e = `Native mesh '${r.meshPath ?? r.meshName ?? "<unnamed>"}' skipped: invalid geometry payload.`;
			c.push(e), l.push(e);
			continue;
		}
		let h = r.submeshes ?? [];
		if (h.length === 0 || m.groups.length !== h.length) {
			m.dispose();
			let e = `Native mesh '${r.meshPath ?? r.meshName ?? "<unnamed>"}' has no exact submesh/material-slot mapping.`;
			c.push(e), l.push(e);
			continue;
		}
		let g = h.map((t, n) => {
			if (!t.materialKey || typeof t.slotIndex != "number") throw Error(`Native mesh '${r.meshPath ?? r.meshName ?? "<unnamed>"}' has a submesh without material identity; regenerate it with Haruki-3D-Exporter materialKey runtime support.`);
			if (t.slotIndex !== n) throw Error(`Native mesh '${r.meshPath ?? r.meshName ?? "<unnamed>"}' material slot ${t.slotIndex} is out of order; expected ${n}.`);
			let i = new e.MeshBasicMaterial({
				color: 16777215,
				vertexColors: m.hasAttribute("color")
			});
			return i.name = t.materialName ?? r.meshName ?? r.meshPath ?? "native_material", i.userData.pjskMaterialKey = t.materialKey, i.userData.pjskMaterialSlotIndex = t.slotIndex, i.userData.pjskPlaceholderMaterial = !0, i;
		}), _ = r.meshName ?? r.meshPath?.split("/").pop() ?? "UnityNativeMesh", v = u.map((e, n) => e === "" ? p : d.length > 0 ? t.nodeByPathId.get(d[n]) : t.nodeByPath.get(e)).filter((e) => !!e), y, b = null, x = [];
		if (u.length > 0) {
			if (v.length !== u.length) {
				let e = `Native mesh '${r.meshPath ?? _}' skipped: ${u.length - v.length} skin bones were unresolved.`;
				c.push(e), l.push(e), m.dispose();
				continue;
			}
			let t = new e.SkinnedMesh(m, g);
			y = t, b = t, x = v, o += 1;
		} else y = new e.Mesh(m, g);
		if (y.name = _, y.userData.pjskNativeUnityMesh = !0, y.userData.pjskPartKind = r.partKind ?? null, y.userData.pjskRendererPathId = r.rendererPathId ?? null, y.frustumCulled = !1, p.add(y), b) {
			t.root.updateMatrixWorld(!0), b.updateMatrixWorld(!0);
			let n = as(r, x.length, c), a = b.matrixWorld.clone();
			if (n.length > 0) {
				let e = a.clone().invert();
				for (let t of n) t.multiply(e);
			}
			let o = new e.Skeleton(x, n.length > 0 ? n : void 0);
			n.length === 0 && o.calculateInverses(), b.bind(o, a);
			let l = rs(x[0], o.boneInverses[0]), u = is(x, o.boneInverses), d = i && t.headRendererPaths.includes(i) ? t.bodyRootBone ?? null : typeof r.rootBonePathId == "number" ? t.nodeByPathId.get(r.rootBonePathId) ?? null : r.rootBonePath ? t.nodeByPath.get(r.rootBonePath) ?? null : null;
			y.userData.pjskUnityRootBone = d, s.push({
				meshName: _,
				partKind: r.partKind ?? null,
				rendererTransformPath: i ?? null,
				rootBonePath: r.rootBonePath ?? null,
				rootBoneResolved: typeof r.rootBonePathId == "number" ? t.nodeByPathId.has(r.rootBonePathId) : r.rootBonePath ? t.nodeByPath.has(r.rootBonePath) : !1,
				effectiveRootBonePath: i && t.headRendererPaths.includes(i) ? t.bodyRootBonePath : r.rootBonePath ?? null,
				effectiveRootBoneResolved: i && t.headRendererPaths.includes(i) ? !!t.bodyRootBone : typeof r.rootBonePathId == "number" ? t.nodeByPathId.has(r.rootBonePathId) : r.rootBonePath ? t.nodeByPath.has(r.rootBonePath) : !1,
				boneCount: x.length,
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
function rs(t, n) {
	let r = new e.Matrix4().multiplyMatrices(t.matrixWorld, n), i = new e.Vector3(), a = new e.Quaternion(), o = new e.Vector3();
	return r.decompose(i, a, o), {
		restTranslation: ms(i),
		restScale: ms(o)
	};
}
function is(t, n) {
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
function as(t, n, r) {
	let i = t.boneInverseBindMatrices ?? [];
	if (n === 0 || i.length === 0) {
		if (n === 0 && i.length === 0) return [];
		throw Error(`Native mesh inverse bind matrices are missing for ${n} bones.`);
	}
	if (i.length !== n * 16) throw Error(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has ${i.length} inverse bind matrix floats for ${n} bones; expected ${n * 16}.`);
	let a = [];
	for (let t = 0; t < i.length; t += 16) a.push(new e.Matrix4().fromArray(i, t));
	return a;
}
function os(t) {
	let n = t.positions ?? [];
	if (n.length === 0 || n.length % 3 != 0) return null;
	let r = n.length / 3, i = new e.BufferGeometry();
	if (i.setAttribute("position", new e.Float32BufferAttribute(n, 3)), $(t, "normals", r * 3), $(t, "tangents", r * 4), $(t, "uv0", r * 2), $(t, "uv1", r * 2), $(t, "uv2", r * 2), $(t, "colors", r * 4), $(t, "skinIndices", r * 4), $(t, "skinWeights", r * 4), (t.skinIndices?.length ?? 0) !== (t.skinWeights?.length ?? 0)) throw Error(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has incomplete skin indices/weights.`);
	(t.normals?.length ?? 0) > 0 && i.setAttribute("normal", new e.Float32BufferAttribute(t.normals, 3)), (t.tangents?.length ?? 0) > 0 && i.setAttribute("tangent", new e.Float32BufferAttribute(t.tangents, 4)), (t.uv0?.length ?? 0) > 0 && i.setAttribute("uv", new e.Float32BufferAttribute(t.uv0, 2)), (t.uv1?.length ?? 0) > 0 && i.setAttribute("uv1", new e.Float32BufferAttribute(t.uv1, 2)), (t.uv2?.length ?? 0) > 0 && i.setAttribute("uv2", new e.Float32BufferAttribute(t.uv2, 2)), (t.colors?.length ?? 0) > 0 && i.setAttribute("color", new e.Float32BufferAttribute(t.colors, 4)), (t.skinIndices?.length ?? 0) > 0 && i.setAttribute("skinIndex", new e.Uint16BufferAttribute(t.skinIndices, 4)), (t.skinWeights?.length ?? 0) > 0 && i.setAttribute("skinWeight", new e.Float32BufferAttribute(t.skinWeights, 4));
	let a = [];
	for (let e of t.submeshes ?? []) {
		let n = a.length, o = e.indices ?? [];
		if (o.length === 0 || o.some((e) => !Number.isInteger(e) || e < 0 || e >= r)) throw Error(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has invalid submesh indices.`);
		a.push(...o), i.addGroup(n, o.length, i.groups.length);
	}
	a.length > 0 && i.setIndex(a);
	let o = [], s = [], c = [], l = /* @__PURE__ */ new Set();
	for (let n of t.morphTargets ?? []) {
		let i = n.name;
		if (typeof i != "string" || i.trim().length === 0) throw Error(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has a morph target without a name.`);
		if (l.has(i)) throw Error(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has duplicate target name '${i}'.`);
		if (l.add(i), n.hasPositionDeltas !== !0) throw Error(`Native morph target '${i}' must explicitly declare position deltas present with hasPositionDeltas=true.`);
		if (typeof n.hasNormalDeltas != "boolean") throw Error(`Native morph target '${i}' must explicitly declare hasNormalDeltas.`);
		if (typeof n.hasTangentDeltas != "boolean") throw Error(`Native morph target '${i}' must explicitly declare hasTangentDeltas.`);
		let a = n.indices, u = n.positionDeltas, d = n.normalDeltas, f = n.tangentDeltas;
		if (!a || a.length === 0) throw Error(`Native morph target '${i}' must contain a non-empty indices array.`);
		if (!u || u.length !== a.length * 3) throw Error(`Native morph target '${i}' has invalid positionDeltas length.`);
		if (!d || d.length !== (n.hasNormalDeltas ? a.length * 3 : 0)) throw Error(`Native morph target '${i}' has invalid normalDeltas length for hasNormalDeltas=${n.hasNormalDeltas}.`);
		if (!f || f.length !== (n.hasTangentDeltas ? a.length * 3 : 0)) throw Error(`Native morph target '${i}' has invalid tangentDeltas length for hasTangentDeltas=${n.hasTangentDeltas}.`);
		if (!Array.from(u).every(Number.isFinite) || !Array.from(d).every(Number.isFinite) || !Array.from(f).every(Number.isFinite)) throw Error(`Native morph target '${i}' delta arrays must contain only finite numbers.`);
		let p = new Float32Array(r * 3), m = n.hasNormalDeltas ? new Float32Array(r * 3) : null, h = n.hasTangentDeltas ? new Float32Array(r * 3) : null, g = /* @__PURE__ */ new Set();
		for (let e = 0; e < a.length; e += 1) {
			let t = a[e];
			if (!Number.isInteger(t) || t < 0 || t >= r) throw Error(`Native morph target '${i}' has invalid vertex index ${t}.`);
			if (g.has(t)) throw Error(`Native morph target '${i}' has duplicate vertex index ${t}.`);
			g.add(t), p[t * 3] = u[e * 3], p[t * 3 + 1] = u[e * 3 + 1], p[t * 3 + 2] = u[e * 3 + 2], m && (m[t * 3] = d[e * 3], m[t * 3 + 1] = d[e * 3 + 1], m[t * 3 + 2] = d[e * 3 + 2]), h && (h[t * 3] = f[e * 3], h[t * 3 + 1] = f[e * 3 + 1], h[t * 3 + 2] = f[e * 3 + 2]);
		}
		let _ = new e.BufferAttribute(p, 3);
		if (_.name = i, o.push(_), m) {
			let t = new e.BufferAttribute(m, 3);
			t.name = i, s.push(t);
		}
		if (h) {
			let t = new e.BufferAttribute(h, 3);
			t.name = i, c.push(t);
		}
	}
	if (o.length > 0 && (i.morphAttributes.position = o, i.morphTargetsRelative = !0), s.length > 0 && s.length !== o.length) throw Error(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has mixed normal delta presence across morph targets.`);
	if (s.length > 0 && (i.morphAttributes.normal = s), c.length > 0 && c.length !== o.length) throw Error(`Native mesh '${t.meshPath ?? t.meshName ?? "<unnamed>"}' has mixed tangent delta presence across morph targets.`);
	if (c.length > 0) {
		let e = i.morphAttributes;
		e.tangent = c;
	}
	return i.computeBoundingSphere(), i;
}
function $(e, t, n) {
	let r = e[t] ?? [];
	if (r.length !== 0 && r.length !== n) throw Error(`Native mesh '${e.meshPath ?? e.meshName ?? "<unnamed>"}' attribute '${t}' has ${r.length} values; expected ${n}.`);
}
function ss(e, t, n, r) {
	e.root.updateMatrixWorld(!0);
	let i = r ? r.update() : ro(e, Z(t)?.constraintSetup, n);
	for (let t of e.meshCarrierBindings) t.target.position.copy(t.source.position), t.target.quaternion.copy(t.source.quaternion), t.target.scale.copy(t.source.scale), t.target.updateMatrix();
	return e.root.updateMatrixWorld(!0), i;
}
function cs(e, t, n) {
	let r = Z(t)?.constraintSetup;
	return r ? new no(e, r, n) : null;
}
function ls(e, t, n) {
	let r = {
		...e?.debug ?? n,
		setupVersion: us(t)
	};
	if (!e) return r;
	let i = e.root;
	i.updateMatrixWorld(!0);
	let a = Z(t)?.bodyHeadAssembly, o = eo(i), s = (t) => {
		let n = Q(e.nodeByPath, t) ?? ds(o, t);
		return n ? gs(n.node, i) : null;
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
		positionRoots: _s(i),
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
function us(e) {
	return Z(e) ? "0414" : "";
}
function ds(e, t) {
	for (let n of t) {
		let t = e.get(n);
		if (t) return {
			node: t,
			path: n
		};
	}
	return null;
}
function fs(e) {
	return e.replace(/_\d+$/, "");
}
function ps(e, t, n = !1) {
	let r = [], i = e;
	for (; i && i !== t;) i.name && r.push(n ? fs(i.name) : i.name), i = i.parent;
	return r.reverse().join("/");
}
function ms(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5))
	};
}
function hs(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5)),
		w: Number(e.w.toFixed(5))
	};
}
function gs(t, n) {
	t.updateMatrixWorld(!0);
	let r = new e.Vector3(), i = new e.Quaternion(), a = new e.Vector3(0, 0, 1);
	return t.getWorldPosition(r), z(t, i), a.applyQuaternion(i).normalize(), {
		path: ps(t, n),
		canonicalPath: ps(t, n, !0),
		parentPath: t.parent && t.parent !== n ? ps(t.parent, n) : null,
		destroyed: t.userData.pjskModelCombineDestroyed === !0,
		localPosition: ms(t.position),
		localQuaternion: hs(t.quaternion),
		worldPosition: ms(r),
		worldQuaternion: hs(i),
		worldForward: ms(a)
	};
}
function _s(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	return e.updateMatrixWorld(!0), e.traverse((r) => {
		if (r === e || !r.name || n.has(r)) return;
		let i = ps(r, e, !0), a = i === "face/Position", o = i === "body/Position", s = i.endsWith("/Position") && i.split("/").some((e) => e.startsWith("mdl_chr_"));
		!a && !o && !s || (n.add(r), t.push(gs(r, e)));
	}), t;
}
//#endregion
export { gt as A, ir as C, Mt as D, qt as E, r as F, i as I, n as L, w as M, h as N, Pt as O, s as P, Or as S, Jt as T, Lr as _, ns as a, kr as b, eo as c, qr as d, ti as f, _i as g, vi as h, cs as i, Be as j, _t as k, Fi as l, li as m, es as n, ls as o, di as p, $o as r, ss as s, Io as t, Yi as u, z as v, Vt as w, Dr as x, Pr as y };
