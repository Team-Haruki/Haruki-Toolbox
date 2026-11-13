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
	let c = e.headOptionalCostume3dId == null ? null : a("headOptionalCostume3dId");
	return {
		roleId: n,
		hairFromCharacterId: e.hairFromCharacterId == null ? null : a("hairFromCharacterId"),
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
		e.hairFromCharacterId ?? ""
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
	return `${e}:${fe(t)}`;
}
function g(e, t, n, r = {}) {
	return e.registry.filter((e) => e.characterId === t).filter((e) => r.unit === void 0 || pe(e.unit, r.unit)).filter((e) => f(e) === n).filter(oe).sort((e, t) => e.costume3dId - t.costume3dId);
}
function _(e) {
	let { partSet: t, selection: n, activeRoleId: r } = e, i = h(n.characterId, n.unit);
	if (r !== null && i !== r) throw Error(`Custom switching is limited to role ${r}. Reload/select another role before switching to ${i}.`);
	let a = v(t, n.characterId, n.unit, "body", n.bodyCostume3dId), o = x(t, n), s = y(t, b(t, n), "hair"), c = {
		...n,
		headPackagePath: o.packagePath
	}, l = ee(t, c, o), u = l && d(l.part) === "head" ? l : s, f = l && d(l.part) === "head_optional" ? l : null, p = te(t, n);
	ce(n.characterId, n.unit, [
		a,
		u,
		f,
		p
	].filter(Boolean)), le(t.compatibility, c, d(o));
	let m = [
		a,
		u,
		f,
		p
	].filter(Boolean), g = me(o), _ = he(m, g), ne = t.role && h(t.role.characterId, t.role.unit) === i ? t.role : null;
	if (!ne) throw Error(`The part set has no role ${i}.`);
	let re = [a, ...he([
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
		characterHeightMeters: ne.characterHeightMeters,
		skinColors: ne.skinColors,
		materialSlots: re,
		runtimeExtension: _e(_)
	};
}
function v(e, t, n, r, i) {
	let a = ae(e, t, n, r, i);
	if (!a) throw Error(`Missing ${r} registry entry for role ${h(t, n)}, costume3dId ${i}.`);
	return y(e, a, r);
}
function y(e, t, n) {
	if (!e.packages.has(t.packagePath)) throw Error(`Missing loaded ${n} package for role ${h(t.characterId, t.unit)}, ${re(t)}.`);
	return ie(e.packages.get(t.packagePath), t);
}
function b(e, t) {
	let n = ae(e, t.characterId, t.unit, "hair", t.hairCostume3dId);
	if (!n) throw Error(`Missing hair registry entry for role ${h(t.characterId, t.unit)}, costume3dId ${t.hairCostume3dId}.`);
	let r = x(e, t).headCostume3dAssetbundleType?.trim().toLowerCase(), i = r ? n.headTypeVariants?.[r] : void 0;
	return i ? {
		...n,
		bundlePath: i.bundlePath,
		packagePath: i.packagePath
	} : n;
}
function x(e, t) {
	let n = t.headPackagePath?.trim() || null, r = e.registry.filter((e) => e.characterId === t.characterId && pe(e.unit, t.unit) && e.costume3dId === t.headCostume3dId && ["head", "head_optional"].includes(f(e) ?? "") && oe(e) && (n === null || e.packagePath === n)).sort((e, t) => {
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
function ee(e, t, n = x(e, t)) {
	if (se(n)) return null;
	if (!e.packages.has(n.packagePath)) throw Error(`Missing loaded head package for role ${h(t.characterId, t.unit)}, ${re(n)}.`);
	return ie(e.packages.get(n.packagePath), n);
}
function te(e, t) {
	let n = ne(e, t);
	if (!n || se(n)) return null;
	if (!e.packages.has(n.packagePath)) throw Error(`Missing loaded head_optional package for role ${h(t.characterId, t.unit)}, ${re(n)}.`);
	return ie(e.packages.get(n.packagePath), n);
}
function ne(e, t) {
	if (!t.headOptionalCostume3dId) return null;
	let n = e.registry.filter((e) => e.characterId === t.characterId && pe(e.unit, t.unit) && e.costume3dId === t.headOptionalCostume3dId && f(e) === "head_optional" && oe(e)).sort((e, t) => e.packagePath.localeCompare(t.packagePath));
	if (n.length === 0) throw Error(`Missing head_optional registry entry for role ${h(t.characterId, t.unit)}, costume3dId ${t.headOptionalCostume3dId}.`);
	let r = new Set(n.map((e) => e.packagePath));
	if (r.size > 1) throw Error(`Ambiguous head_optional registry entry for role ${h(t.characterId, t.unit)}, costume3dId ${t.headOptionalCostume3dId}; the legacy selector cannot identify one original source. Candidates: ${[...r].join(", ")}.`);
	return n[0];
}
function re(e) {
	let t = [
		`costume3dId ${e.costume3dId}`,
		`partType ${d(e)}`,
		`packagePath ${e.packagePath}`
	];
	e.bundlePath && t.push(`bundlePath ${e.bundlePath}`), e.colorVariationBundlePath && t.push(`colorVariationBundlePath ${e.colorVariationBundlePath}`);
	let n = e.warnings?.[0];
	return n && t.push(`warning ${n}`), t.join(", ");
}
function ie(e, t) {
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
function ae(e, t, n, r, i) {
	return e.registry.find((e) => e.characterId === t && pe(e.unit, n) && e.costume3dId === i && f(e) === r && oe(e));
}
function oe(e) {
	return e.status !== "missing";
}
function se(e) {
	return e.status === "empty" && f(e) === "head_optional";
}
function ce(e, t, n) {
	let r = n.find((n) => n.part.characterId !== e || !pe(n.part.unit, t));
	if (r) throw Error(`Part ${r.part.partType}/${r.part.costume3dId} belongs to role ${h(r.part.characterId, r.part.unit)}, not ${h(e, t)}.`);
}
function le(e, t, n) {
	if (!e || n === "head") return;
	let r = de(t.unit, t.headCostume3dId, t.hairCostume3dId);
	if (ue(e).has(r)) throw Error(`Head ${t.headCostume3dId} and hair ${t.hairCostume3dId} are not available together.`);
}
function ue(e) {
	if (!e) return /* @__PURE__ */ new Set();
	let t = l.get(e);
	if (t) return t;
	let n = new Set([...e.denied ?? [], ...(e.rules ?? []).filter((e) => e.state === "not_available")].map((e) => de(e.unit, e.headCostume3dId, e.hairCostume3dId)));
	return l.set(e, n), n;
}
function de(e, t, n) {
	return `${fe(e)}|${t}|${n}`;
}
function fe(e) {
	return e ?? "";
}
function pe(e, t) {
	return fe(e) === fe(t);
}
function me(e) {
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
function he(e, t) {
	return e.filter((e) => ge(e, t));
}
function ge(e, t) {
	return t.activePartTypes.has(d(e.part));
}
function S(e) {
	return typeof e == "string" ? e : "";
}
function _e(e) {
	let t = ye(e);
	return {
		characterControllers: ve(e),
		nativeMeshes: lt(e, t),
		pjskSpringBone: {
			raw: t.raw,
			runtimeUnitySetup: t
		}
	};
}
function ve(e) {
	let t = e.findIndex((e) => {
		let t = d(e.part);
		return t === "head" || t === "hair";
	}), n = t >= 0 ? e[t].characterControllers ?? {} : {}, r = (e) => {
		if (Array.isArray(e)) return e.map(r);
		if (!E(e) || ArrayBuffer.isView(e)) return e;
		let n = {};
		for (let [i, a] of Object.entries(e)) n[i] = (i === "pathId" || i === "transformPathId") && typeof a == "number" ? w(a, t) : i === "raw" ? a : r(a);
		return n;
	};
	return r(n);
}
function ye(e) {
	let t = e.map((e, t) => Pe(e, t)), n = t[0]?.setup ?? {}, r = t.map((e) => e.prefabGraph).filter((e) => e !== null), i = e.flatMap((e) => [...e.warnings ?? [], ...e.springBone?.warnings ?? []]), a = bt(t.flatMap((e) => e.activeRoots)), o = t.flatMap((e) => e.managers), s = t.flatMap((e) => e.bones), c = t.flatMap((e) => e.extraBones), l = t.flatMap((e) => e.colliders), u = t.flatMap((e) => e.constraints), d = Xe(t), f = be(i, d), p = tt(t, d), m = et(s, d), h = ke(r);
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
		funit: De(e),
		raw: Oe(t),
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
			warnings: bt(t.flatMap((e) => yt(e.setup.constraintSetup?.warnings)))
		},
		managerColliderCaches: p,
		warnings: f
	};
	return xe(t, g, dt(e)), g;
}
function be(e, t) {
	let n = t.filter((e) => e.sourceKind === "colliderFlag");
	return n.length > 0 && n.every((e) => O(e.colliders).length > 0) ? e.filter((e) => !/has colliderFlag .* but no body colliders matched runtime CL_\* prefixes/.test(e)) : e;
}
function xe(e, t, n) {
	for (let r of e.filter((e) => e.partType === "head_optional")) {
		let i = r.prefabGraph, a = _t(S(r.runtime.mount?.attachNode)), o = a ? Se(e, a) : null, s = (i?.transforms ?? []).find((e) => e.parentPathId == null && S(e.transformPath) === "optional");
		if (!i || !o || !s || typeof o.pathId != "number" || typeof s.pathId != "number") {
			t.warnings?.push(`Head optional prefab '${S(r.runtime.part.modelAssetbundleName) || "<unknown>"}' was not instantiated: official prefab root 'optional' or active attach node '${a || "<missing>"}' was not found.`);
			continue;
		}
		let c = (i.monoBehaviours ?? []).find((e) => S(e.scriptName) === "CharacterAccessoryTransformController" && we(S(e.transformPath), "optional"));
		if (c) {
			let e = S(c.transformPath), a = (i.transforms ?? []).find((t) => S(t.transformPath) === e);
			a ? (Te(a, pt(r.runtime, n)), i.headOptionalControllerPath = e) : t.warnings?.push(`Head optional controller target '${e || "<missing>"}' was not found in prefab 'optional'.`);
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
		Ce(i, "optional"), s.parentPathId = o.pathId, o.childPathIds = [.../* @__PURE__ */ new Set([...o.childPathIds ?? [], s.pathId])], i.headOptionalAttachPath = S(o.transformPath), i.headOptionalPrefabRootPath = "optional";
	}
}
function Se(e, t) {
	for (let n of e) {
		if (n.partType === "head_optional" || !n.prefabGraph) continue;
		let e = n.prefabGraph.transforms ?? [], r = new Map(e.filter((e) => typeof e.pathId == "number").map((e) => [e.pathId, e])), i = new Map(D(n.prefabGraph.gameObjects).map((e) => [gt(e.pathId, NaN), e.activeSelf !== !1 && e.activeInHierarchy !== !1])), a = (e) => typeof e.gameObjectPathId != "number" || i.get(e.gameObjectPathId) !== !1, o = (e) => {
			if (!a(e)) return null;
			if (S(e.name) === t || _t(S(e.transformPath)) === t) return e;
			for (let t of e.childPathIds ?? []) {
				let e = r.get(t), n = e ? o(e) : null;
				if (n) return n;
			}
			return null;
		};
		for (let t of n.activeRoots) {
			let n = e.find((e) => e.parentPathId == null && S(e.transformPath) === t), r = n ? o(n) : null;
			if (r) return r;
		}
	}
	return null;
}
function Ce(e, t) {
	let n = (e) => we(S(e.transformPath), t);
	e.transforms = (e.transforms ?? []).filter(n), e.gameObjects = D(e.gameObjects).filter(n), e.renderers = D(e.renderers).filter(n), e.animators = D(e.animators).filter(n), e.monoBehaviours = (e.monoBehaviours ?? []).filter(n), e.constraints = D(e.constraints).filter(n), e.rootTransformPathIds = e.transforms.filter((e) => S(e.transformPath) === t).map((e) => e.pathId).filter((e) => typeof e == "number");
}
function we(e, t) {
	return e === t || e.startsWith(`${t}/`);
}
function Te(e, t) {
	let n = ht(t?.position, 0, 0, 0), r = ht(t?.rotationEulerDegrees, 0, 0, 0), i = ht(t?.scale, 1, 1, 1);
	e.localPosition = {
		X: n.x,
		Y: n.y,
		Z: n.z
	}, e.localRotation = Ee(r), e.localScale = {
		X: Math.abs(i.x),
		Y: Math.abs(i.y),
		Z: Math.abs(i.z)
	};
}
function Ee(e) {
	let t = e.x * Math.PI / 180, n = e.y * Math.PI / 180, r = e.z * Math.PI / 180, i = Math.cos(t / 2), a = Math.cos(n / 2), o = Math.cos(r / 2), s = Math.sin(t / 2), c = Math.sin(n / 2), l = Math.sin(r / 2);
	return {
		x: s * a * o - i * c * l,
		y: i * c * o + s * a * l,
		z: i * a * l + s * c * o,
		w: i * a * o - s * c * l
	};
}
function De(e) {
	let t = e.map((e) => vt(e.springBone?.funit)).filter((e) => Object.keys(e).length > 0), n = (e, t) => typeof e[t] == "number" && Number.isFinite(e[t]) ? Math.max(Math.trunc(e[t]), 0) : 0, r = bt(t.flatMap((e) => yt(e.detectedScripts))).sort((e, t) => e.localeCompare(t));
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
function Oe(e) {
	let t = e.filter((e) => e.partType === "body").flatMap((e) => e.extraBones), n = e.filter((e) => e.partType === "head" || e.partType === "hair" || e.partType === "head_optional").flatMap((e) => e.extraBones);
	return {
		body: { extraBones: t },
		head: { extraBones: n }
	};
}
function ke(e) {
	let t = Ae(e), n = je(e);
	return !t || !Me(e, "face") || !n ? null : {
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
function Ae(e) {
	return ["body/Position/PositionOffset/Hip/Waist/Spine/Chest/Neck", "body/Position/Hip/Waist/Spine/Chest/Neck"].find((t) => Me(e, t)) ?? null;
}
function je(e) {
	return ["face/Position/Hip/Waist/Spine/Chest/Neck", "face/Position"].find((t) => Me(e, t)) ?? null;
}
function Me(e, t) {
	return e.some((e) => D(e?.transforms).some((e) => S(e.transformPath) === t));
}
function Ne(e) {
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
function Pe(e, t) {
	let n = Ne(e), r = d(e.part), i = Fe(r, yt(n.activeRootProfile?.activeRoots)), a = Ie(C(n.managers, t, r), i), o = Ie(C(n.bones, t, r), i), s = Ie(Le(n.extraBones, t, r), i), c = Ie(C(n.colliders, t, r), i), l = ze(C(n.colliderBindings, t, r), o), u = Be(C(n.managerColliderCaches, t, r), a), f = Ve(n.constraintSetup, t, r, i);
	return Ue(a, o, u), {
		runtime: e,
		partIndex: t,
		partType: r,
		setup: n,
		prefabGraph: He(e.springBone?.prefabGraph, t),
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
function Fe(e, t) {
	return e === "body" && t.includes("body") ? ["body"] : (e === "head" || e === "hair") && t.includes("face") ? ["face"] : e === "head_optional" && t.includes("optional") ? ["optional"] : t.length ? [t[0]] : [e === "body" ? "body" : "face"];
}
function Ie(e, t) {
	let n = new Set(t.map((e) => T(e)));
	return e.filter((e) => {
		let t = T(ct(e.nodePath) ?? e.poseRoot);
		return n.has(t);
	});
}
function Le(e, t, n) {
	return C(e, t, n).map((e) => {
		let n = e, r = Re(n.gameObject ?? n.GameObject, t), i = Re(n.referenceBone ?? n.ReferenceBone, t);
		return n.gameObject = r, n.GameObject = r, n.referenceBone = i, n.ReferenceBone = i, n.nodePath = r?.transformPath ?? r?.TransformPath ?? null, n.poseRoot = ct(n.nodePath) ?? null, n;
	});
}
function Re(e, t) {
	if (!E(e)) return e;
	let n = { ...e };
	return typeof n.pathId == "number" && (n.pathId = w(n.pathId, t)), typeof n.PathId == "number" && (n.PathId = w(n.PathId, t)), n;
}
function ze(e, t) {
	let n = new Set(t.map((e) => e.pathId).filter((e) => typeof e == "number"));
	return e.filter((e) => typeof e.sourceSpringBonePathId != "number" || n.has(e.sourceSpringBonePathId));
}
function Be(e, t) {
	let n = new Set(t.map((e) => e.pathId).filter((e) => typeof e == "number"));
	return e.filter((e) => typeof e.managerPathId != "number" || n.has(e.managerPathId));
}
function Ve(e, t, n, r) {
	let i = new Set(r.map((e) => T(e)));
	return C(e?.constraints, t, n).map((e) => {
		let n = D(e.sources).map((e) => {
			let n = { ...e };
			return typeof n.sourcePathId == "number" && (n.sourcePathId = w(n.sourcePathId, t)), n;
		});
		return typeof e.worldUpObjectPathId == "number" && (e.worldUpObjectPathId = w(e.worldUpObjectPathId, t)), {
			...e,
			sources: n
		};
	}).filter((e) => {
		let t = T(ct(e.ownerPath));
		return !t || i.has(t);
	});
}
function He(e, t) {
	if (!E(e)) return null;
	let n = { ...e };
	return n.runtimePartIndex = t, n.transforms = D(e.transforms).map((e) => {
		let n = {
			...e,
			runtimePartIndex: t
		};
		return typeof n.pathId == "number" && (n.pathId = w(n.pathId, t)), typeof n.PathId == "number" && (n.PathId = w(n.PathId, t)), typeof n.parentPathId == "number" && (n.parentPathId = w(n.parentPathId, t)), Array.isArray(n.childPathIds) && (n.childPathIds = n.childPathIds.map((e) => typeof e == "number" ? w(e, t) : e)), n;
	}), n.monoBehaviours = D(e.monoBehaviours).map((e) => {
		let n = {
			...e,
			runtimePartIndex: t
		};
		return typeof n.pathId == "number" && (n.pathId = w(n.pathId, t)), n;
	}), n;
}
function Ue(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = n.nodePath, i = t.filter((t) => We(t.nodePath, e)).map((e) => e.pathId).filter((e) => typeof e == "number");
		i.length && (n.bonePathIds = i, typeof n.pathId == "number" && r.set(n.pathId, i));
	}
	for (let e of n) {
		let t = typeof e.managerPathId == "number" ? r.get(e.managerPathId) : void 0;
		t?.length && (e.springBonePathIds = t);
	}
}
function We(e, t) {
	return !e || !t ? !1 : e === t || e.startsWith(`${t}/`);
}
function C(e, t, n) {
	return Array.isArray(e) ? e.map((e) => {
		if (!E(e)) return e;
		let r = { ...e };
		return r.runtimePartIndex = t, r.runtimePartType = n, typeof r.pathId == "number" && (r.pathId = w(r.pathId, t)), typeof r.index == "number" && (r.index = w(r.index, t)), typeof r.managerPathId == "number" && (r.managerPathId = w(r.managerPathId, t)), typeof r.pivotSourcePathId == "number" && (r.pivotSourcePathId = w(r.pivotSourcePathId, t)), typeof r.sourceSpringBonePathId == "number" && (r.sourceSpringBonePathId = w(r.sourceSpringBonePathId, t)), Array.isArray(r.bonePathIds) && (r.bonePathIds = r.bonePathIds.map((e) => typeof e == "number" ? w(e, t) : e)), Array.isArray(r.forceProviders) && (r.forceProviders = Ge(r.forceProviders, t)), Array.isArray(r.directColliderPathIds) && (r.directColliderPathIds = r.directColliderPathIds.map((e) => typeof e == "number" ? w(e, t) : e)), Array.isArray(r.sourceColliderPathIds) && (r.sourceColliderPathIds = r.sourceColliderPathIds.map((e) => typeof e == "number" ? w(e, t) : e)), Array.isArray(r.colliders) && (r.colliders = r.colliders.map((e) => typeof e == "number" ? w(e, t) : e)), Array.isArray(r.selectedColliderIndexes) && (r.selectedColliderIndexes = r.selectedColliderIndexes.map((e) => typeof e == "number" ? w(e, t) : e)), Array.isArray(r.sphereColliderIndexes) && (r.sphereColliderIndexes = r.sphereColliderIndexes.map((e) => typeof e == "number" ? w(e, t) : e)), Array.isArray(r.capsuleColliderIndexes) && (r.capsuleColliderIndexes = r.capsuleColliderIndexes.map((e) => typeof e == "number" ? w(e, t) : e)), Array.isArray(r.panelColliderIndexes) && (r.panelColliderIndexes = r.panelColliderIndexes.map((e) => typeof e == "number" ? w(e, t) : e)), Array.isArray(r.springBonePathIds) && (r.springBonePathIds = r.springBonePathIds.map((e) => typeof e == "number" ? w(e, t) : e)), E(r.collidersByRoot) && (r.collidersByRoot = Ke(r.collidersByRoot, t)), E(r.candidateRoots) && (r.candidateRoots = Ke(r.candidateRoots, t)), r;
	}) : [];
}
function Ge(e, t) {
	return e.map((e) => {
		if (!E(e)) return e;
		let n = {
			...e,
			runtimePartIndex: t
		};
		return typeof n.sourcePathId == "number" && (n.sourcePathId = w(n.sourcePathId, t)), typeof n.springManagerPathId == "number" && (n.springManagerPathId = w(n.springManagerPathId, t)), n;
	});
}
function w(e, t) {
	return (t + 1) * 1e9 + e;
}
function Ke(e, t) {
	return Object.fromEntries(Object.entries(e).map(([e, n]) => [e, Array.isArray(n) ? n.map((e) => typeof e == "number" ? w(e, t) : e).filter((e) => typeof e == "number") : []]));
}
var qe = [
	[1, "CL_Hip"],
	[2, "CL_Chest"],
	[4, "CL_Left_Arm"],
	[8, "CL_Right_Arm"],
	[16, "CL_Left_Elbow"],
	[32, "CL_Right_Elbow"]
];
function Je(e) {
	return qe.filter(([t]) => (e & t) !== 0).map(([, e]) => e);
}
function Ye(e) {
	return e.flatMap((e) => e.partType === "body" ? [] : e.bones.filter((t) => (t.colliderFlag ?? 0) === 0 || typeof t.pathId != "number" ? !1 : !e.colliderBindings.some((e) => e.sourceSpringBonePathId === t.pathId && (e.sourceKind === "deferred_body_colliderFlag" || e.sourceKind === "colliderFlag"))).map((t) => ({
		sourceKind: "deferred_body_colliderFlag",
		partKind: t.partKind ?? e.partType,
		sourceSpringBonePathId: t.pathId,
		colliderFlag: t.colliderFlag,
		matchedPrefixes: Je(t.colliderFlag ?? 0),
		collidersByRoot: {},
		defaultRoot: "body",
		sourceColliderPathIds: [],
		colliders: [],
		rebindReason: "viewer_synthesized_missing_colliderFlag_binding"
	})));
}
function Xe(e) {
	let t = e.filter((e) => e.partType === "body").flatMap((e) => e.colliders), n = it(t);
	return Ye(e).map((e) => Ze(e, t)).concat(e.flatMap((e) => e.colliderBindings.map((r) => {
		if (r.sourceKind === "deferred_body_colliderFlag" && e.partType !== "body") return Ze(r, t);
		if (r.sourceKind !== "colliderFlag" || e.partType === "body" || !at(n)) return r;
		let i = ot(n);
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
function Ze(e, t) {
	let n = Qe(e, t);
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
function Qe(e, t) {
	let n = yt(e.matchedPrefixes), r = it(t.filter((e) => typeof e.index == "number" && $e(e, n))), i = at(r) ? ot(r).root : T(e.defaultRoot ?? "body");
	return {
		byRoot: r,
		defaultRoot: i,
		indexes: r[i] ?? []
	};
}
function $e(e, t) {
	if (!t.length) return !1;
	let n = S(e.nodeName);
	return t.some((e) => n.startsWith(e));
}
function et(e, t) {
	let n = new Map(e.filter((e) => typeof e.pathId == "number").map((e) => [e.pathId, e]));
	return t.filter((e) => typeof e.sourceSpringBonePathId == "number").map((e) => {
		let t = n.get(e.sourceSpringBonePathId), r = at(e.collidersByRoot) ? e.collidersByRoot : { [e.defaultRoot ?? t?.poseRoot ?? "unknown"]: e.colliders ?? [] };
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
function tt(e, t) {
	let n = new Map(e.flatMap((e) => e.colliders).filter((e) => typeof e.index == "number").map((e) => [e.index, e]));
	return e.flatMap((e) => e.managerColliderCaches.map((r) => e.partType === "head" || e.partType === "hair" ? nt(r, t, n) : rt(r, n)));
}
function nt(e, t, n) {
	let r = new Set(O(e.springBonePathIds)), i = xt(t.filter((e) => typeof e.sourceSpringBonePathId == "number" && r.has(e.sourceSpringBonePathId) && e.sourceKind === "colliderFlag").flatMap((e) => O(e.colliders)).filter((e) => n.has(e)));
	return i.length ? {
		...e,
		sphereColliderIndexes: i.filter((e) => S(n.get(e)?.scriptName).includes("Sphere")),
		capsuleColliderIndexes: i.filter((e) => S(n.get(e)?.scriptName).includes("Capsule")),
		panelColliderIndexes: i.filter((e) => S(n.get(e)?.scriptName).includes("Panel")),
		reason: "viewer_composed_head_body_collider_cache"
	} : rt(e, n);
}
function rt(e, t) {
	return {
		...e,
		sphereColliderIndexes: O(e.sphereColliderIndexes).filter((e) => t.has(e)),
		capsuleColliderIndexes: O(e.capsuleColliderIndexes).filter((e) => t.has(e)),
		panelColliderIndexes: O(e.panelColliderIndexes).filter((e) => t.has(e)),
		reason: "viewer_composed_active_parts_manager_cache"
	};
}
function it(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		if (typeof n.index != "number") continue;
		let e = T(ct(n.nodePath) ?? n.poseRoot ?? "body"), r = t.get(e) ?? [];
		r.push(n.index), t.set(e, r);
	}
	return Object.fromEntries([...t.entries()].map(([e, t]) => [e, [...new Set(t)].sort((e, t) => e - t)]));
}
function at(e) {
	return !!(e && Object.values(e).some((e) => e.length > 0));
}
function ot(e) {
	let [t, n] = Object.entries(e).sort(([e], [t]) => st(e) - st(t) || e.localeCompare(t))[0];
	return {
		root: t,
		indexes: n
	};
}
function st(e) {
	return e === "body" ? 0 : e === "sit_body" ? 1 : e === "guitar_body" ? 2 : 10;
}
function T(e) {
	return (e ?? "").trim() || "body";
}
function ct(e) {
	return e?.split("/").find(Boolean) ?? null;
}
function lt(e, t) {
	let n = [...t.warnings ?? []], r = [];
	for (let [i, a] of e.entries()) {
		let e = d(a.part);
		for (let o of D(a.nativeMeshes?.meshes)) {
			let a = ut(o, i);
			if (e !== "head_optional") {
				r.push(a);
				continue;
			}
			let s = S(a.rendererTransformPath), c = D(t.prefabGraphs).find((e) => gt(e.runtimePartIndex, -1) === i && !!S(e.headOptionalAttachPath)), l = S(c?.headOptionalPrefabRootPath);
			if (!c || !l) {
				n.push(`Head optional mesh '${S(o.meshPath) || S(o.meshName) || "<unnamed>"}' was skipped because the official prefab could not be mounted.`);
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
function ut(e, t) {
	let n = { ...e };
	for (let e of [
		"rendererPathId",
		"rendererTransformPathId",
		"rootBonePathId"
	]) typeof n[e] == "number" && (n[e] = w(n[e], t));
	return Array.isArray(n.bonePathIds) && (n.bonePathIds = n.bonePathIds.map((e) => typeof e == "number" ? w(e, t) : e)), n;
}
function dt(e) {
	let t = [
		...e.filter((e) => d(e.part) === "head"),
		...e.filter((e) => d(e.part) === "hair"),
		...e.filter((e) => d(e.part) !== "head_optional")
	];
	for (let e of t) {
		let t = ft(S(e.source?.bundlePath));
		if (t) return t;
		let n = ft(S(e.part.modelAssetbundleName));
		if (n) return n;
	}
	return null;
}
function ft(e) {
	let t = e.replace(/\\/g, "/").replace(/\.bundle$/i, "").match(/(?:^|\/)face\/([^/]+)\/([^/]+)$/i);
	return t ? `${t[1]}/${t[2]}` : null;
}
function pt(e, t) {
	if (!t) return null;
	let n = mt(e)[t];
	return E(n) ? n : null;
}
function mt(e) {
	return vt(e.mount?.accessoryTransformAdjustments);
}
function ht(e, t, n, r) {
	let i = vt(e);
	return {
		x: gt(i.x ?? i.X, t),
		y: gt(i.y ?? i.Y, n),
		z: gt(i.z ?? i.Z, r)
	};
}
function gt(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function _t(e) {
	return (e?.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? "") || null;
}
function E(e) {
	return !!(e && typeof e == "object" && !Array.isArray(e));
}
function vt(e) {
	return E(e) ? e : {};
}
function yt(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "string") : [];
}
function D(e) {
	return Array.isArray(e) ? e.filter((e) => E(e)) : [];
}
function O(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "number") : [];
}
function bt(e) {
	return [...new Set(e)];
}
function xt(e) {
	return [...new Set(e)].sort((e, t) => e - t);
}
function St(e) {
	let { runtime: t, role: n } = e;
	if (d(t.part) !== "head_optional") throw Error(`Part ${t.packagePath} is not a head_optional part.`);
	let r = "optional", i = He(t.springBone?.prefabGraph, 0), a = i?.transforms?.find((e) => e.parentPathId == null && S(e.transformPath) === r);
	if (!i || !a) throw Error(`Head optional part ${t.packagePath} has no official prefab root '${r}'.`);
	Ce(i, r), a.localPosition = {
		X: 0,
		Y: 0,
		Z: 0
	}, a.localRotation = {
		x: 0,
		y: 0,
		z: 0,
		w: 1
	}, i.headOptionalPrefabRootPath = r;
	let o = D(t.nativeMeshes?.meshes).map((e) => ut(e, 0)).filter((e) => we(S(e.rendererTransformPath), r));
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
var Ct = class {
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
		if (this.assertSameActiveCharacter(n), await this.ensureSelectionPackages(n), !t()) throw wt();
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
			ne(this.partSet, e)
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
function wt() {
	let e = /* @__PURE__ */ Error("Custom part selection was superseded by a newer request.");
	return e.name = "AbortError", e;
}
//#endregion
//#region src/original/unityFile.ts
var Tt = new TextDecoder("utf-8", { fatal: !0 });
function k(e, t) {
	if (!e) throw Error(t);
}
var Et = class {
	bytes;
	little;
	view;
	offset = 0;
	constructor(e, t = !1) {
		this.bytes = e, this.little = t, this.view = new DataView(e.buffer, e.byteOffset, e.byteLength);
	}
	ensure(e) {
		k(e >= 0 && this.offset + e <= this.bytes.length, "truncated Unity data");
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
		k(e >= 0, "unterminated Unity string");
		let t = Tt.decode(this.bytes.subarray(this.offset, e));
		return this.offset = e + 1, t;
	}
	count(e = 2147483647) {
		let t = this.i32();
		return k(t >= 0 && t <= e, `invalid Unity array length ${t}`), t;
	}
};
function A(e, t) {
	return k(e >= 0n && e <= BigInt(2 ** 53 - 1), `${t} out of range`), Number(e);
}
function Dt(e, t) {
	let n = new Uint8Array(t), r = 0, i = 0, a = e.length;
	for (; r < a;) {
		let o = e[r++], s = o >>> 4;
		if (s === 15) {
			let t;
			do
				t = e[r++], s += t;
			while (t === 255);
		}
		if (k(r + s <= a && i + s <= t, "LZ4 literal run out of range"), n.set(e.subarray(r, r + s), i), r += s, i += s, r >= a) break;
		let c = e[r] | e[r + 1] << 8;
		r += 2, k(c > 0 && c <= i, "invalid LZ4 match distance");
		let l = o & 15;
		if (l === 15) {
			let t;
			do
				t = e[r++], l += t;
			while (t === 255);
		}
		l += 4, k(i + l <= t, "LZ4 match out of range");
		let u = i - c;
		if (c >= l) n.copyWithin(i, u, u + l), i += l;
		else for (let e = 0; e < l; e++) n[i++] = n[u++];
	}
	return k(i === t, "LZ4 output size mismatch"), n;
}
function Ot(e, t, n) {
	let r = n & 63;
	return r === 0 ? (k(e.length === t, "uncompressed UnityFS block size mismatch"), e) : (k(r === 2 || r === 3, `unsupported UnityFS block compression ${r}`), Dt(e, t));
}
function kt(e) {
	let t = new Et(e);
	k(t.cstring() === "UnityFS", "not a UnityFS bundle");
	let n = t.u32();
	k(n === 8, `unsupported UnityFS version ${n}`);
	let r = t.cstring(), i = t.cstring();
	k(A(t.i64(), "UnityFS size") === e.length, "UnityFS size mismatch");
	let a = t.u32(), o = t.u32(), s = t.u32();
	t.align(16);
	let c = t.offset, l = (s & 128) != 0, u = l ? e.length - a : c, d = new Et(Ot(e.subarray(u, u + a), o, s));
	d.take(16);
	let f = Array.from({ length: d.count(1 << 20) }, () => ({
		size: d.u32(),
		compressed: d.u32(),
		flags: d.u16()
	})), p = Array.from({ length: d.count(65536) }, () => ({
		offset: A(d.i64(), "node offset"),
		size: A(d.i64(), "node size"),
		flags: d.u32(),
		path: d.cstring()
	})), m = l ? c : u + a;
	s & 512 && (m = Math.ceil(m / 16) * 16);
	let h = f.reduce((e, t) => e + t.size, 0), g;
	if (f.every((e) => (e.flags & 63) == 0)) g = e.subarray(m, m + h), k(g.length === h, "truncated UnityFS data");
	else {
		g = new Uint8Array(h);
		let t = 0;
		for (let n of f) g.set(Ot(e.subarray(m, m + n.compressed), n.size, n.flags), t), m += n.compressed, t += n.size;
	}
	let _ = /* @__PURE__ */ new Map();
	for (let e of p) k(e.offset + e.size <= g.length && !_.has(e.path), `invalid UnityFS node ${e.path}`), _.set(e.path, {
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
var At = new TextEncoder().encode((/* @__PURE__ */ "AABB.AnimationClip.AnimationCurve.AnimationState.Array.Base.BitField.bitset.bool.char.ColorRGBA.Component.data.deque.double.dynamic_array.FastPropertyName.first.float.Font.GameObject.Generic Mono.GradientNEW.GUID.GUIStyle.int.list.long long.map.Matrix4x4f.MdFour.MonoBehaviour.MonoScript.m_ByteSize.m_Curve.m_EditorClassIdentifier.m_EditorHideFlags.m_Enabled.m_ExtensionPtr.m_GameObject.m_Index.m_IsArray.m_IsStatic.m_MetaFlag.m_Name.m_ObjectHideFlags.m_PrefabInternal.m_PrefabParentObject.m_Script.m_StaticEditorFlags.m_Type.m_Version.Object.pair.PPtr<Component>.PPtr<GameObject>.PPtr<Material>.PPtr<MonoBehaviour>.PPtr<MonoScript>.PPtr<Object>.PPtr<Prefab>.PPtr<Sprite>.PPtr<TextAsset>.PPtr<Texture>.PPtr<Texture2D>.PPtr<Transform>.Prefab.Quaternionf.Rectf.RectInt.RectOffset.second.set.short.size.SInt16.SInt32.SInt64.SInt8.staticvector.string.TextAsset.TextMesh.Texture.Texture2D.Transform.TypelessData.UInt16.UInt32.UInt64.UInt8.unsigned int.unsigned long long.unsigned short.vector.Vector2f.Vector3f.Vector4f.m_ScriptingClassIdentifier.Gradient.Type*.int2_storage.int3_storage.BoundsInt.m_CorrespondingSourceObject.m_PrefabInstance.m_PrefabAsset.FileSize.Hash128.RenderingLayerMask.fixed_array.EntityId.".split(".")).join("\0")), jt = 16384;
function j(e, t) {
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
var Mt = (() => {
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
		array: j(Uint16Array, (e, t, n) => e.getUint16(t, n))
	}, i = {
		size: 2,
		read: (e) => e.i16(),
		array: j(Int16Array, (e, t, n) => e.getInt16(t, n))
	}, a = {
		size: 4,
		read: (e) => e.u32(),
		array: j(Uint32Array, (e, t, n) => e.getUint32(t, n))
	}, o = {
		size: 4,
		read: (e) => e.i32(),
		array: j(Int32Array, (e, t, n) => e.getInt32(t, n))
	}, s = {
		size: 4,
		read: (e) => e.f32(),
		array: j(Float32Array, (e, t, n) => e.getFloat32(t, n))
	}, c = {
		size: 8,
		read: (e) => e.f64(),
		array: j(Float64Array, (e, t, n) => e.getFloat64(t, n))
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
function Nt(e) {
	let t = (e.metaFlags & jt) !== 0, n = (e, t) => t ? (t) => {
		let n = e(t);
		return t.align(), n;
	} : e, r = Mt[e.type];
	if (r && e.children.length === 0) return n(r.read, t);
	if (e.type === "string") return (e) => {
		let t = e.count(), n = Tt.decode(e.take(t));
		return e.align(), n;
	};
	if (e.type === "TypelessData") return n((e) => e.take(e.count()), t);
	let i = e.children[0];
	if (i && i.type === "Array") {
		k(i.children.length === 2, `invalid TypeTree array ${e.name}`);
		let r = i.children[1], a = t || (i.metaFlags & jt) !== 0, o = Mt[r.type];
		if (o && r.children.length === 0 && (r.metaFlags & jt) === 0) return n((e) => {
			let t = e.count(), n = e.take(t * o.size);
			return o.array(n, t, e.little);
		}, a);
		let s = Nt(r);
		return n((e) => {
			let t = e.count();
			r.byteSize > 0 && e.ensure(t * r.byteSize);
			let n = Array(t);
			for (let r = 0; r < t; r++) n[r] = s(e);
			return n;
		}, a);
	}
	k(e.children.length > 0, `unsupported TypeTree leaf ${e.type} ${e.name}`);
	let a = e.children.map((e) => [e.name, Nt(e)]);
	return n((e) => {
		let t = {};
		for (let [n, r] of a) t[n] = r(e);
		return t;
	}, t);
}
function Pt(e) {
	let t = e.count(1 << 20), n = e.count(1 << 26);
	k(t > 0, "missing embedded TypeTree");
	let r = Array(t);
	for (let n = 0; n < t; n++) {
		e.u16();
		let t = e.u8();
		e.u8();
		let i = e.u32(), a = e.u32(), o = e.i32();
		e.i32();
		let s = e.i32();
		k(e.u64() === 0n, "managed-reference TypeTrees are not supported"), r[n] = {
			level: t,
			typeOffset: i,
			nameOffset: a,
			byteSize: o,
			metaFlags: s
		};
	}
	let i = e.take(n), a = (e) => {
		let t = (e & 2147483648) == 0, n = t ? i : At, r = t ? e : e & 2147483647, a = n.indexOf(0, r);
		return Tt.decode(n.subarray(r, a < 0 ? n.length : a));
	}, o = [], s = null;
	for (let e of r) {
		let t = {
			type: a(e.typeOffset),
			name: a(e.nameOffset),
			byteSize: e.byteSize,
			metaFlags: e.metaFlags,
			children: []
		};
		k(e.level <= o.length, "invalid TypeTree nesting"), o.length = e.level, e.level === 0 ? s = t : o[e.level - 1].children.push(t), o.push(t);
	}
	return s;
}
function Ft(e) {
	let t = new Et(e);
	t.u32(), t.u32();
	let n = t.u32();
	t.u32(), k(n === 22, `unsupported SerializedFile version ${n}`);
	let r = t.u8();
	t.take(3);
	let i = t.u32(), a = A(t.i64(), "file size"), o = A(t.i64(), "data offset");
	t.i64(), k(a === e.length, "SerializedFile size mismatch"), t.little = r === 0;
	let s = t.cstring(), c = t.i32();
	k(t.u8() === 1, "SerializedFile without TypeTrees");
	let l = [];
	for (let e = t.count(65536); e > 0; e--) {
		let e = t.i32();
		t.u8();
		let n = t.i16();
		e === 114 && t.take(16), t.take(16);
		let r = Pt(t);
		t.take(t.count(1 << 20) * 4), l.push({
			classId: e,
			typeName: r.type,
			scriptTypeIndex: n,
			read: Nt(r)
		});
	}
	let u = /* @__PURE__ */ new Map(), d = t.little;
	for (let n = t.count(1 << 24); n > 0; n--) {
		t.align();
		let n = t.i64(), r = A(t.i64(), "object offset") + o, i = t.u32(), s = l[t.i32()];
		k(s && r + i <= a && !u.has(n), `invalid object entry ${n}`);
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
					let t = new Et(e.subarray(r, r + i), d);
					c = s.read(t), k(t.offset === i, `object ${n} (class ${s.classId}): ${i - t.offset} bytes unread`);
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
	return k(t.count(65536) === 0, "SerializedFile reference types are not supported"), t.cstring(), k(t.offset === 48 + i, "SerializedFile metadata size mismatch"), {
		unityVersion: s,
		targetPlatform: c,
		objects: u,
		externals: f
	};
}
//#endregion
//#region src/original/unityBundle.ts
var It = /* @__PURE__ */ function(e) {
	return e[e.GameObject = 1] = "GameObject", e[e.Transform = 4] = "Transform", e[e.Material = 21] = "Material", e[e.MeshRenderer = 23] = "MeshRenderer", e[e.Texture2D = 28] = "Texture2D", e[e.MeshFilter = 33] = "MeshFilter", e[e.Mesh = 43] = "Mesh", e[e.Shader = 48] = "Shader", e[e.AnimationClip = 74] = "AnimationClip", e[e.Animator = 95] = "Animator", e[e.MonoBehaviour = 114] = "MonoBehaviour", e[e.MonoScript = 115] = "MonoScript", e[e.SkinnedMeshRenderer = 137] = "SkinnedMeshRenderer", e[e.AssetBundle = 142] = "AssetBundle", e;
}({});
function Lt(e, t) {
	if (!e) throw Error(t);
}
var Rt = class {
	name;
	serialized;
	streams = /* @__PURE__ */ new Map();
	pathCache = /* @__PURE__ */ new Map();
	assetBundle;
	cabName;
	size;
	constructor(e, t) {
		this.name = e;
		let n = kt(t);
		this.size = [...n.nodes.values()].reduce((e, t) => e + t.bytes.length, 0);
		let r = null, i = "";
		for (let t of n.nodes.values()) t.flags & 4 ? (Lt(!r, `${e}: more than one SerializedFile`), r = Ft(t.bytes), i = t.path) : this.streams.set(t.path, t.bytes);
		Lt(r, `${e}: no SerializedFile`), this.serialized = r, this.cabName = i;
		let a = [...r.objects.values()].find((e) => e.classId === 142);
		Lt(a, `${e}: no AssetBundle object`), this.assetBundle = a.read();
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
		return Lt(i, `${this.name}: stream ${e} not in bundle`), Lt(t + n <= i.length, `${this.name}: stream range ${t}+${n} exceeds ${r}`), i.subarray(t, t + n);
	}
	resource(e, t) {
		let n = this.assetBundle.m_Container.filter((n) => {
			let r = this.local(n.second.asset);
			if (!r || r.classId !== 1 || r.read().m_Name.toLowerCase() !== e.toLowerCase()) return !1;
			let i = n.first.replace(/\\/g, "/"), a = /\/(fbx|sourceimages)\//i.test(i);
			return i.toLowerCase().endsWith(t.toLowerCase()) && !a;
		});
		Lt(n.length === 1, `${this.name}: resource ${e} matches ${n.length} container entries ending in ${t}`);
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
function zt(e, t) {
	if (!e) throw Error(t);
}
var Bt = {
	48: 4,
	49: 5,
	50: 6,
	51: 8,
	52: 10,
	53: 12
}, Vt = {
	4: e.RGBA_ASTC_4x4_Format,
	5: e.RGBA_ASTC_5x5_Format,
	6: e.RGBA_ASTC_6x6_Format,
	8: e.RGBA_ASTC_8x8_Format,
	10: e.RGBA_ASTC_10x10_Format,
	12: e.RGBA_ASTC_12x12_Format
}, Ht = 7, Ut = null;
async function Wt(e) {
	return Ut ||= (async () => {
		let t = e ?? await (await fetch("data:application/wasm;base64,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IBNBCGohEyAIQQhqIQggA0EIaiEDIA9BBGohDyABQQhqIQEgBUEBaiIFIA0oAgQgDSgCAGxIDQALDAELIA0oAgQgDSgCAGwhACANKAIQQQFMBEAgAEEATA0BQQAhDwNAIAEgAmogDSgCPCANKAJMIAIgDWpBvAFqIgAoAgAgDSgCJEECdEHgtghqKAIAEQAArSANKAJAIA0oAlAgACgCACANKAIkQQJ0QeC2CGooAgARAACtQhCGhCANKAJEIA0oAlQgACgCACANKAIkQQJ0QeC2CGooAgARAACtQiCGhCANKAJIIA0oAlggACgCACANKAIkQQJ0QaC3CGooAgARAACtQjCGhDcDACACQQhqIQIgD0EBaiIPIA0oAgQgDSgCAGxIDQALDAELIABBAEwNACANQTxqIQUgDUEkaiECQbwKIRMDQCABIANqIAUgDSATaigCACIAQQV0aiIHKAIAIAcoAhAgAyANakG8AWoiBigCACACIABBAnRqIgAoAgBBAnRB4LYIaigCABEAAK0gBygCBCAHKAIUIAYoAgAgACgCAEECdEHgtghqKAIAEQAArUIQhoQgBygCCCAHKAIYIAYoAgAgACgCAEECdEHgtghqKAIAEQAArUIghoQgBygCDCAHKAIcIAYoAgAgACgCAEECdEGgtwhqKAIAEQAArUIwhoQ3AwAgE0EEaiETIANBCGohAyAIQQFqIgggDSgCBCANKAIAbEgNAAsLIAlBEGokAAwBCyAdQQBMDQBBACEBICdFBEAgBCEAA0AgAEL//4OAcDcDACAAQThqQv//g4BwNwMAIABBMGpC//+DgHA3AwAgAEEoakL//4OAcDcDACAAQSBqQv//g4BwNwMAIABBGGpC//+DgHA3AwAgAEEQakL//4OAcDcDACAAQQhqQv//g4BwNwMAIABBQGshACAmIAFBCGoiAUcNAAsLIB5FDQAgBCABQQN0aiEAIB4hAQNAIABC//+DgHA3AwAgAEEIaiEAIAFBAWsiAQ0ACwsCQCAbQQBMIgANACAADQBBACEGIAQhAyAjIQIDQCAiIQAgAyEBIAIhCCAbIQUgBiAvaiArTg0BA0AgACAqSARAIAggASkDADcDACAAQQFqIQAgAUEIaiEBIAhBCGohCCAFQQFrIgUNAQsLIAMgJWohAyACIC1qIQIgBkEBaiIGIBtHDQALCyAbICJqISIgIyAlaiEjIA5BEGohDiAoQQFqIiggJEcNAAsgICAuaiEgICFBAWoiISAsRw0AC0HgwAgtAABBf3NBAXELIARBgBhqJAALC4o2WQBBhIAICwUBAAAAAgBBlIAICzUBAAAAAgAAAAEAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgBB1IAICyUBAAAAAgAAAAEAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEGEgQgLBQEAAAACAEGUgQgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEHUgQgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAABAAAAAAAAAAEAAAACAEGUgggLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEHUgggLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEGUgwgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEHUgwgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEGUhAgLNQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAAAACAAAAAAAAAAEAAAACAEHUhAgLJQEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQYSFCAsFAQAAAAIAQZSFCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQdSFCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAEAAAAAAAAAAQAAAAIAQZSGCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQdSGCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQZSHCAs1AQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAQAAAAIAQdSHCAspAQAAAAIAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAABAAAAAgAAAAIAQZCICAspAQAAAAEAAAABAAAAAAAAAAIAAAACAAAAAgAAAAAAAAACAAAAAgAAAAIAQcyICAshAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAABAEGQiQgLKQEAAAABAAAAAQAAAAAAAAACAAAAAgAAAAIAAAAAAAAAAgAAAAIAAAACAEHMiQgLLQEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAQBBkIoICykBAAAAAQAAAAEAAAAAAAAAAgAAAAIAAAACAAAAAAAAAAIAAAACAAAAAgBBzIoICy0BAAAAAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAgAAAAEAAAACAAAAAgAAAAIAQZCLCAspAQAAAAEAAAABAAAAAAAAAAIAAAACAAAAAgAAAAAAAAACAAAAAgAAAAIAQcyLCAstAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAABAAAAAgAAAAIAAAACAEGQjAgLKQEAAAABAAAAAQAAAAAAAAACAAAAAgAAAAIAAAAAAAAAAgAAAAIAAAACAEHMjAgLIQEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAQBB/IwICwEBAEGQjQgLKQEAAAABAAAAAQAAAAAAAAACAAAAAgAAAAIAAAAAAAAAAgAAAAIAAAACAEHMjQgLMQEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAQAAAAEAQZCOCAspAQAAAAEAAAABAAAAAAAAAAIAAAACAAAAAgAAAAAAAAACAAAAAgAAAAIAQcyOCAsxAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAABAAAAAgAAAAIAAAACAAAAAQBBkI8ICykBAAAAAQAAAAEAAAAAAAAAAgAAAAIAAAACAAAAAAAAAAIAAAACAAAAAgBBzI8ICzEBAAAAAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAgAAAAEAAAACAAAAAgAAAAIAAAABAEGMkAgLAQIAQZyQCAsBAgBBrJAIC0ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgBB/JAICwECAEGMkQgLAQIAQZyRCAsBAgBBrJEIC0ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgBB/JEICwECAEGMkggLAQIAQZySCAsBAgBBrJIIC0ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgBB/JIICwECAEGMkwgLAQIAQZyTCAsBAgBBrJMIC1ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAgAAAAIAQYyUCAsBAgBBnJQICwECAEGslAgLUQIAAAACAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgBBjJUICwECAEGclQgLAQIAQayVCAtRAgAAAAIAAAACAAAAAgAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAEGMlggLAQIAQZyWCAsBAgBBrJYIC1ECAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAQAAAAEAAAABAAAAAgAAAAEAAAABAAAAAQAAAAIAQYyXCAsBAgBBnJcICwECAEGslwgLUQIAAAACAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAgAAAAEAAAABAAAAAQAAAAIAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgBB8JgIC40CAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAQfCbCAsNAgAAAAIAAAACAAAAAgBB8JwIC40DAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAgBB8KAICw0CAAAAAgAAAAIAAAACAEHwoQgLDQIAAAACAAAAAgAAAAIAQfCiCAupBgIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAgAAAAIAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAAAAAAEAAAACAAAAAwAAAAQAAAAAAAAABAAAAAQAAAAAAAAAAQAAAAIAAAADAAAABAAAAAEAAAAEAAAABAAAAAAAAAABAAAAAgAAAAMAAAAEAAAAAgAAAAQAAAAEAAAAAAAAAAEAAAACAAAAAwAAAAQAAAADAAAABAAAAAQAAAAAAAAAAQAAAAIAAAADAAAABAAAAAAAAAAEAEGkqQgL7QEBAAAAAgAAAAMAAAAEAAAAAQAAAAQAAAABAAAAAAAAAAEAAAACAAAAAwAAAAQAAAACAAAABAAAAAIAAAAAAAAAAQAAAAIAAAADAAAABAAAAAMAAAAEAAAAAwAAAAAAAAABAAAAAgAAAAMAAAAEAAAAAAAAAAIAAAADAAAAAAAAAAEAAAACAAAAAwAAAAQAAAABAAAAAgAAAAMAAAAAAAAAAQAAAAIAAAADAAAABAAAAAIAAAACAAAAAwAAAAAAAAABAAAAAgAAAAMAAAAEAAAAAwAAAAIAAAADAAAAAAAAAAEAAAACAAAAAwAAAAQAQZyrCAthAQAAAAAAAAABAAAAAgAAAAMAAAAEAAAAAQAAAAAAAAABAAAAAAAAAAEAAAACAAAAAwAAAAQAAAACAAAAAAAAAAEAAAAAAAAAAQAAAAIAAAADAAAABAAAAAMAAAAAAAAAAQBBlKwIC2kEAAAABAAAAAQAAAABAAAAAQAAAAEAAAABAAAAAQAAAAQAAAAEAAAABAAAAAIAAAACAAAAAgAAAAIAAAACAAAABAAAAAQAAAAEAAAAAwAAAAMAAAADAAAAAwAAAAMAAAAEAAAABAAAAAQAQZStCAtpBAAAAAAAAAAEAAAAAQAAAAEAAAABAAAAAQAAAAEAAAAEAAAAAQAAAAQAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAACAAAABAAAAAMAAAADAAAAAwAAAAMAAAADAAAABAAAAAMAAAAEAEGUrggLAQQAQaCuCAtdAQAAAAEAAAABAAAAAQAAAAEAAAAEAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAACAAAAAgAAAAMAAAADAAAAAwAAAAMAAAADAAAABAAAAAMAAAADAEGUrwgLAQQAQaCvCAtdAQAAAAEAAAABAAAAAQAAAAEAAAAEAAAAAQAAAAEAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAACAAAAAgAAAAMAAAADAAAAAwAAAAMAAAADAAAABAAAAAMAAAADAEGcsAgLAQQAQbiwCAsFAQAAAAQAQdiwCAsFAgAAAAQAQfiwCAuFAwMAAAAEAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAABAAAAAQAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAAEAAAABAAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAQAAAAEAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAABAAAAAQAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAAEAAAABAAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAAEAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAABAAAAAQAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAAEAAAABAAAAAMAAAADAAAAAwAAAAMAAAADAAAAAwAAAAQAAAAEAAAAAwAAAAMAAAADAAAAAwAAAAMAAAADAAAABAAAAAQAAAADAAAAAwAAAAMAAAADAAAAAwAAAAMAAAAEAAAABAAAAAMAAAADAAAAAwAAAAMA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")).arrayBuffer(), { instance: n } = await WebAssembly.instantiate(t, {}), r = n.exports;
		return { decode16(e, t, n, i) {
			let a = r.__heap_base.value, o = Math.ceil(a / 16) * 16, s = Math.ceil((o + e.length) / 16) * 16, c = s + t * n * 8;
			return c > r.memory.buffer.byteLength && r.memory.grow(Math.ceil((c - r.memory.buffer.byteLength) / 65536)), new Uint8Array(r.memory.buffer).set(e, o), zt(r.decode_rgba16(o, t, n, i, s) === 1, "ASTC decode failed (invalid or HDR block)"), new Uint16Array(r.memory.buffer, s, t * n * 4).slice();
		} };
	})(), Ut;
}
function Gt(e, t) {
	let n = e.object(t);
	zt(n && n.classId === It.Texture2D, `${e.name}: ${t} is not a Texture2D`);
	let r = n.read();
	zt(r.m_MipCount === 1, `${r.m_Name}: ${r.m_MipCount} mip levels (only single-level textures are expected)`);
	let i = r.m_StreamData.path ? e.stream(r.m_StreamData.path, Number(r.m_StreamData.offset), r.m_StreamData.size) : r["image data"];
	return zt(Bt[r.m_TextureFormat] || r.m_TextureFormat === Ht, `${r.m_Name}: texture format ${r.m_TextureFormat} is not supported`), {
		name: r.m_Name,
		width: r.m_Width,
		height: r.m_Height,
		format: r.m_TextureFormat,
		data: i.slice()
	};
}
function Kt(e) {
	if (e === 65535) return 15360;
	if (e < 4) return e << 8;
	let t = Math.clz32(e) - 16;
	return (e * 2 ** (t + 1) & 65535) >> 6 | 14 - t << 10;
}
async function qt(t, n) {
	let { width: r, height: i, data: a } = t, o = Bt[t.format], s;
	if (o) if (n.nativeAstc) s = new e.CompressedTexture([{
		data: a,
		width: r,
		height: i
	}], r, i, Vt[o]);
	else {
		let t = (await Wt()).decode16(a, r, i, o);
		for (let e = 0; e < t.length; e++) t[e] = Kt(t[e]);
		s = new e.DataTexture(t, r, i, e.RGBAFormat, e.HalfFloatType);
	}
	else {
		zt(a.length === r * i * 2, `${t.name}: RGB565 size mismatch`);
		let n = new Uint16Array(a.buffer, a.byteOffset, r * i), o = new Uint16Array(n.length * 4);
		for (let t = 0; t < n.length; t++) {
			let r = n[t];
			o[t * 4] = e.DataUtils.toHalfFloat((r >> 11 & 31) / 31), o[t * 4 + 1] = e.DataUtils.toHalfFloat((r >> 5 & 63) / 63), o[t * 4 + 2] = e.DataUtils.toHalfFloat((r & 31) / 31), o[t * 4 + 3] = e.DataUtils.toHalfFloat(1);
		}
		s = new e.DataTexture(o, r, i, e.RGBAFormat, e.HalfFloatType);
	}
	return s.name = t.name, s.flipY = !1, s.generateMipmaps = !1, s.colorSpace = e.NoColorSpace, s.needsUpdate = !0, s;
}
async function Jt(e) {
	let { width: t, height: n, data: r } = e, i = Bt[e.format], a = new Uint8Array(t * n * 4);
	if (i) {
		let e = (await Wt()).decode16(r, t, n, i);
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
var Yt = class {
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
			zt(n, `original texture ${e} was not delivered with its part`), t = qt(n, this.caps), this.textures.set(e, t);
		}
		return t;
	}
	dispose() {
		for (let e of this.textures.values()) e.then((e) => e.dispose());
		this.textures.clear(), this.payloads.clear();
	}
}, Xt = null;
function Zt(e) {
	return Xt ??= new Yt(e ?? { nativeAstc: !1 }), Xt;
}
function Qt(e) {
	return { nativeAstc: e.extensions.has("WEBGL_compressed_texture_astc") };
}
//#endregion
//#region src/original/hairRecolor.ts
var $t = 256;
function en(e, t, n, r, i) {
	let a = (e) => {
		let t = e / 255;
		return t <= .04045 ? t / 12.92 : ((t + .055) / 1.055) ** 2.4;
	}, o = a(e), s = a(t), c = a(n), l = (.4124 * o + .3576 * s + .1805 * c) / .95047, u = .2126 * o + .7152 * s + .0722 * c, d = (.0193 * o + .1192 * s + .9505 * c) / 1.08883, f = (e) => e > .008856 ? Math.cbrt(e) : 7.787 * e + 16 / 116, p = f(l), m = f(u), h = f(d);
	r[i] = 116 * m - 16, r[i + 1] = 500 * (p - m), r[i + 2] = 200 * (m - h);
}
function tn(e, t, n, r, i) {
	let a = (e + 16) / 116, o = a + t / 500, s = a - n / 200, c = (e) => e ** 3 > .008856 ? e ** 3 : (e - 16 / 116) / 7.787, l = c(o) * .95047, u = c(a), d = c(s) * 1.08883, f = (e) => {
		let t = e <= .0031308 ? 12.92 * e : 1.055 * Math.max(e, 0) ** (1 / 2.4) - .055;
		return Math.max(0, Math.min(255, Math.round(t * 255)));
	};
	r[i] = f(3.2406 * l - 1.5372 * u - .4986 * d), r[i + 1] = f(-.9689 * l + 1.8758 * u + .0415 * d), r[i + 2] = f(.0557 * l - .204 * u + 1.057 * d);
}
function nn(e, t, n, r, i = new Uint8Array(e * t)) {
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
function rn(e, t, n, r) {
	let i = e;
	for (let e = 0; e < r; e++) {
		let e = i.slice();
		for (let r = 0; r < n; r++) for (let a = 0; a < t; a++) {
			let o = r * t + a;
			i[o] || (a > 0 && i[o - 1] || a < t - 1 && i[o + 1] || r > 0 && i[o - t] || r < n - 1 && i[o + t]) && (e[o] = 1);
		}
		i = e;
	}
	return i;
}
function an(e, t) {
	let n = t.reduce((e, t) => e + t, 0);
	if (n === 0) throw Error("the palette hair covers no texel");
	let r = new Float32Array(n * 3), i = 0;
	for (let n = 0; n < t.length; n++) t[n] && en(e.data[n * 4], e.data[n * 4 + 1], e.data[n * 4 + 2], r, 3 * i++);
	let a = Array.from({ length: n }, (e, t) => t).sort((e, t) => r[e * 3] - r[t * 3]), o = a.slice(Math.floor(n * .4)), s = (e) => e.sort((e, t) => e - t)[e.length >> 1], c = s(o.map((e) => r[e * 3 + 1])), l = s(o.map((e) => r[e * 3 + 2])), u = a.filter((e) => {
		let t = r[e * 3 + 1], n = r[e * 3 + 2];
		return Math.hypot(t, n) <= 12 || Math.hypot(t - c, n - l) <= 35;
	}), d = u.length >= n * .5 ? u : a, f = new Float32Array($t * 3);
	for (let e = 0; e < $t; e++) {
		let t = Math.floor(e * d.length / $t), n = Math.max(t + 1, Math.floor((e + 1) * d.length / $t)), i = 0, a = 0, o = 0;
		for (let e = t; e < n; e++) {
			let t = d[Math.min(e, d.length - 1)];
			i += r[t * 3], a += r[t * 3 + 1], o += r[t * 3 + 2];
		}
		let s = n - t;
		f[e * 3] = i / s, f[e * 3 + 1] = a / s, f[e * 3 + 2] = o / s;
	}
	let p = f.slice();
	for (let e = 0; e < $t; e++) for (let t of [1, 2]) {
		let n = 0, r = 0;
		for (let i = -4; i <= 4; i++) {
			let a = Math.min($t - 1, Math.max(0, e + i));
			n += f[a * 3 + t], r++;
		}
		p[e * 3 + t] = n / r;
	}
	return p;
}
function on(e, t, n, r) {
	let i = e.data.slice(), a = /* @__PURE__ */ new Float32Array(3), o = [];
	for (let n = 0; n < t.length; n++) t[n] && (en(e.data[n * 4], e.data[n * 4 + 1], e.data[n * 4 + 2], a, 0), o.push(a[0]));
	if (o.length === 0) return i;
	let s = Float32Array.from(o).sort(), c = r.length / 3;
	for (let t = 0; t < n.length; t++) {
		if (!n[t]) continue;
		en(e.data[t * 4], e.data[t * 4 + 1], e.data[t * 4 + 2], a, 0);
		let o = 0, l = s.length;
		for (; o < l;) {
			let e = o + l >> 1;
			s[e] < a[0] ? o = e + 1 : l = e;
		}
		let u = Math.min(c - 1, Math.floor(o / s.length * c));
		tn(r[u * 3], r[u * 3 + 1], r[u * 3 + 2], i, t * 4);
	}
	return i;
}
//#endregion
//#region src/original/borrowedHair.ts
var sn = "borrowed-hair:", cn = 8, ln = ["_MainTex", "_ShadowTex"], un = /* @__PURE__ */ new WeakMap(), dn = (e) => e.startsWith(sn), fn = (e) => -e;
function M(e, t) {
	if (!e) throw Error(t);
}
async function pn(e, t, n) {
	let r = t.role;
	M(r, "borrowed hair needs the part set's role");
	let i = fn(n), a = t.registry.find((e) => e.partType === "hair" && e.costume3dId === i);
	if (a) return a;
	M(n !== r.characterId, "a character cannot borrow its own hair");
	let o = await e.characterUnit(n), s = await e.roleIndex(n, o), c = s.registry.find((e) => e.partType === "hair" && e.costume3dId === s.role.hairCostume3dId);
	M(c?.bundlePath, `character ${n} has no default hair bundle`);
	let l = t.registry.find((e) => e.partType === "hair" && e.costume3dId === r.hairCostume3dId);
	M(l?.bundlePath, `role ${r.characterId} has no default hair bundle`);
	let u = un.get(t) ?? /* @__PURE__ */ new Map();
	un.set(t, u);
	let d = (e) => `${sn}${r.characterId}:${n}:${e}`;
	u.set(d(c.packagePath), {
		source: c,
		palette: l,
		roleCharacterId: r.characterId
	});
	let f = c.headTypeVariants ? Object.fromEntries(Object.entries(c.headTypeVariants).flatMap(([e, t]) => t ? (u.set(d(t.packagePath), {
		source: {
			...c,
			bundlePath: t.bundlePath,
			packagePath: t.packagePath
		},
		palette: l,
		roleCharacterId: r.characterId
	}), [[e, {
		bundlePath: t.bundlePath,
		packagePath: d(t.packagePath)
	}]]) : [])) : null, p = {
		...c,
		characterId: r.characterId,
		unit: r.unit,
		costume3dId: i,
		packagePath: d(c.packagePath),
		headTypeVariants: f
	};
	return t.registry = [...t.registry, p], p;
}
function mn(e) {
	let t = e.nativeMeshes?.meshes ?? [], n = t.filter((e) => e.meshName === "Hair"), r = n.length ? n : t, i = new Set(r.flatMap((e) => e.submeshes.map((t) => `${e.meshName}|${t.materialKey}`))), a = (e.materialSlots ?? []).filter((e) => i.has(`${e.meshName}|${e.materialKey}`)), o = {};
	for (let e of ln) {
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
function hn(e, t, n) {
	let r = new Uint8Array(e * t);
	for (let { uv: i, indices: a } of n.uvs) nn(e, t, i, a, r);
	return r;
}
async function gn(t, n, r, i) {
	let a = Zt(), o = a.payload(t), s = a.payload(n);
	M(o && s, `borrowed hair textures ${t} / ${n} were not delivered`);
	let [c, l] = await Promise.all([Jt(o), Jt(s)]), { width: u, height: d } = o, f = hn(u, d, r), p = an({
		width: s.width,
		height: s.height,
		data: l
	}, hn(s.width, s.height, i)), m = on({
		width: u,
		height: d,
		data: c
	}, f, rn(f, u, d, cn), p), h = new e.DataTexture(m, u, d, e.RGBAFormat, e.UnsignedByteType);
	return h.name = `${o.name} (recoloured)`, h.flipY = !1, h.generateMipmaps = !1, h.colorSpace = e.NoColorSpace, h.needsUpdate = !0, h;
}
async function _n(e, t, n) {
	let r = un.get(t)?.get(n.packagePath);
	M(r, `no source for borrowed hair ${n.packagePath}`);
	let [i, a] = await Promise.all([e.build(r.source), e.build(r.palette)]), o = mn(i), s = mn(a), c = /* @__PURE__ */ new Map();
	for (let e of ln) {
		let t = o.uris[e], n = s.uris[e];
		if (!t || !n) continue;
		let i = `original:recolor/${r.roleCharacterId}/${t.slice(9)}`;
		Zt().define(i, () => gn(t, n, o, s)), c.set(t, i);
	}
	let l = (e) => e === "Hair", u = (i.materialSlots ?? []).filter((e) => l(e.meshName)).map((e) => ({
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
	})), d = (a.materialSlots ?? []).filter((e) => !l(e.meshName)), f = i.springBone?.prefabGraph?.transforms ?? [], p = new Map(f.filter((e) => e.transformPath).map((e) => [e.transformPath, e.pathId])), m = f.map((e) => e.transformPath).find((e) => e?.endsWith("/Head"));
	M(m, "the donor's hierarchy has no Head");
	let h = (e) => p.has(e) ? e : m, g = i.nativeMeshes?.meshes ?? [], _ = (a.nativeMeshes?.meshes ?? []).filter((e) => !l(e.meshName)).map((e) => {
		let t = e.rendererTransformPath ?? null;
		M(t && p.has(t), `the donor's hierarchy has no ${t ?? "renderer node"} for the role's ${e.meshName}`);
		let n = (e.bonePaths ?? []).map((e) => e === "" ? "" : h(e));
		return {
			...e,
			rendererTransformPathId: p.get(t),
			bonePaths: n,
			bonePathIds: n.map((e) => e === "" ? 0 : p.get(e)),
			rootBonePath: e.rootBonePath ? h(e.rootBonePath) : e.rootBonePath ?? null,
			rootBonePathId: e.rootBonePath ? p.get(h(e.rootBonePath)) : e.rootBonePathId ?? null
		};
	}), v = i.nativeMeshes ?? {}, y = {
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
			...v,
			meshes: [..._, ...g.filter((e) => l(e.meshName))]
		},
		materialSlots: [...d, ...u],
		characterControllers: y
	};
}
//#endregion
//#region src/runtime/runtimePackageLoader.ts
async function vn(e, t) {
	let n = xn(t.roleId), r = await e.roleIndex(n.characterId, n.unit);
	if (r.registry.length === 0) throw Error(`The master rows have no parts for role ${t.roleId}.`);
	let i = {
		registry: r.registry,
		role: r.role,
		masterVersion: r.masterVersion,
		compatibility: r.compatibility,
		packages: /* @__PURE__ */ new Map(),
		contentId: e.id
	}, a = new Ct({ loadPartRuntime: (t) => bn(e, i, t) });
	return a.loadPartPackageSet(i), {
		combinedCharacter: t.deferDefaultSelection ? null : await a.setCustomSelection(yn(r.role)),
		partSet: i,
		wardrobe: a
	};
}
function yn(e) {
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
async function bn(e, t, n) {
	let r = t.packages.get(n.packagePath);
	if (r) return r;
	let i = dn(n.packagePath) ? await _n(e, t, n) : await e.build(n);
	return t.packages.set(n.packagePath, i), i;
}
function xn(e) {
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
var Sn = {
	right: new e.Vector3(1, 0, 0),
	left: new e.Vector3(-1, 0, 0),
	up: new e.Vector3(0, 1, 0),
	down: new e.Vector3(0, -1, 0),
	forward: new e.Vector3(0, 0, 1),
	back: new e.Vector3(0, 0, -1)
};
function Cn(t, n) {
	if (!t) return n.clone();
	let r = F(t.x ?? t.X), i = F(t.y ?? t.Y), a = F(t.z ?? t.Z);
	return r === null || i === null || a === null ? n.clone() : new e.Vector3(r, i, a);
}
function wn(t) {
	if (!t) return new e.Quaternion();
	let n = F(t.x ?? t.X), r = F(t.y ?? t.Y), i = F(t.z ?? t.Z), a = F(t.w ?? t.W);
	return n === null || r === null || i === null || a === null ? new e.Quaternion() : Tn(new e.Quaternion(n, r, i, a));
}
function Tn(e) {
	let t = Math.fround, n = t(e.x), r = t(e.y), i = t(e.z), a = t(e.w), o = t(n * n), s = t(r * r), c = t(i * i), l = t(a * a), u = t(t(o + s) + t(c + l)), d = t(t(s + c) + t(l + o)), f = t(Math.sqrt(u)), p = t(Math.sqrt(d));
	return e.set(u > t(1e-30) ? t(n / f) : 0, d > t(1e-30) ? t(r / p) : 0, u > t(1e-30) ? t(i / f) : 0, d > t(1e-30) ? t(a / p) : 1);
}
function En(t) {
	return new e.Vector3(-t.x, t.y, t.z);
}
function Dn(e) {
	return En(e);
}
function On(t) {
	return new e.Quaternion(t.x, -t.y, -t.z, t.w);
}
function kn(e) {
	return Dn(Sn[e]);
}
function N(e, t) {
	let n = Math.fround;
	t.identity();
	for (let r = e; r; r = r.parent) {
		let e = n(r.quaternion.x), i = n(r.quaternion.y), a = n(r.quaternion.z), o = n(r.quaternion.w), s = r.scale.x < 0 ? -1 : 1, c = r.scale.y < 0 ? -1 : 1, l = r.scale.z < 0 ? -1 : 1, u = t.x * c * l, d = t.y * s * l, f = t.z * s * c, p = t.w;
		t.set(n(n(n(n(i * f) - n(a * d)) + n(o * u)) + n(e * p)), n(n(n(n(a * u) - n(e * f)) + n(o * d)) + n(i * p)), n(n(n(n(o * f) - n(i * u)) + n(a * p)) + n(e * d)), n(n(n(n(o * p) - n(e * u)) - n(a * f)) - n(i * d)));
	}
	return t;
}
var An = new e.Quaternion();
function P(e, t) {
	let n = Math.fround;
	t.set(n(e.position.x), n(e.position.y), n(e.position.z));
	for (let r = e.parent; r; r = r.parent) t.set(n(t.x * n(r.scale.x)), n(t.y * n(r.scale.y)), n(t.z * n(r.scale.z))), Nn(t, r.quaternion), t.set(n(t.x + n(r.position.x)), n(t.y + n(r.position.y)), n(t.z + n(r.position.z)));
	return t;
}
function jn(e, t) {
	let n = [];
	for (let t = e; t; t = t.parent) n.push(t);
	let r = Math.fround;
	t.set(r(t.x), r(t.y), r(t.z));
	for (let e = n.length - 1; e >= 0; e--) {
		let i = n[e];
		t.set(r(t.x - r(i.position.x)), r(t.y - r(i.position.y)), r(t.z - r(i.position.z))), Nn(t, i.quaternion, !0), t.set(r(t.x * Mn(i.scale.x)), r(t.y * Mn(i.scale.y)), r(t.z * Mn(i.scale.z)));
	}
	return t;
}
function Mn(e) {
	let t = Math.fround, n = t(e), r = Math.abs(n);
	if (r < t(1e-9)) return 0;
	if (!Number.isFinite(n)) return 1 / n;
	let i = 2 ** Math.floor(Math.log2(r)), a = Math.floor((r / i - 1) * 2048), o = t(Math.sign(n) * Math.round(8192 / (1 + (a + .5) / 2048)) / 8192 / i), s = t(o * t(2.000000476837158 - t(o * n)));
	return s = t(s * t(2 - t(s * n))), Number.isNaN(s) ? o : s;
}
function Nn(e, t, n = !1) {
	let r = Math.fround, i = e.x, a = e.y, o = e.z, s = n ? -1 : 1, c = s * r(t.x), l = s * r(t.y), u = s * r(t.z), d = r(t.w), f = r(r(-2 * l * l) - r(2 * u * u)), p = r(r(-2 * u * d) - r(-2 * c * l)), m = r(r(2 * c * u) - r(-2 * l * d)), h = r(r(2 * l * c) - r(-2 * u * d)), g = r(r(-2 * u * u) - r(2 * c * c)), _ = r(r(-2 * c * d) - r(-2 * l * u)), v = r(r(-2 * l * d) - r(-2 * u * c)), y = r(r(2 * u * l) - r(-2 * c * d)), b = r(r(-2 * c * c) - r(2 * l * l));
	e.set(r(r(r(f * i) + i) + r(r(p * a) + r(m * o))), r(r(r(h * i) + a) + r(r(g * a) + r(_ * o))), r(r(r(v * i) + o) + r(r(y * a) + r(b * o))));
}
function Pn(e, t) {
	return t.copy(Fn(t, N(e, An)));
}
function Fn(t, n) {
	let r = Math.fround, i = r(n.x * 2), a = r(n.y * 2), o = r(n.z * 2), s = r(n.x * i), c = r(n.y * a), l = r(n.z * o), u = r(n.x * a), d = r(n.x * o), f = r(n.y * o), p = r(n.w * i), m = r(n.w * a), h = r(n.w * o);
	return new e.Vector3(r((1 - (c + l)) * t.x + (u - h) * t.y + (d + m) * t.z), r((u + h) * t.x + (1 - (s + l)) * t.y + (f - p) * t.z), r((d - m) * t.x + (f + p) * t.y + (1 - (s + c)) * t.z));
}
function In(t, n, r) {
	let i = Math.fround, a = i(e.MathUtils.clamp(r, 0, 1)), o = i(t.x), s = i(t.y), c = i(t.z), l = i(t.w), u = i(n.x), d = i(n.y), f = i(n.z), p = i(n.w);
	i(i(i(i(o * u) + i(s * d)) + i(c * f)) + i(l * p)) < 0 && (u = -u, d = -d, f = -f, p = -p);
	let m = i(o + i(i(u - o) * a)), h = i(s + i(i(d - s) * a)), g = i(c + i(i(f - c) * a)), _ = i(l + i(i(p - l) * a)), v = i(Math.sqrt(i(i(i(i(m * m) + i(h * h)) + i(g * g)) + i(_ * _))));
	return v > 0 ? new e.Quaternion(i(m / v), i(h / v), i(g / v), i(_ / v)) : new e.Quaternion();
}
function F(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
//#endregion
//#region src/engine/utjSpringBoneRuntime.ts
var Ln = /* @__PURE__ */ function(e) {
	return e[e.NoCollision = 0] = "NoCollision", e[e.HeadIsEmbedded = 1] = "HeadIsEmbedded", e[e.TailCollision = 2] = "TailCollision", e;
}({}), I = 1e-5, Rn = .001, zn = new e.Vector3(1, 0, 0);
function Bn(t, n) {
	return {
		currTipPos: n.clone(),
		prevTipPos: n.clone(),
		hitNormal: new e.Vector3(0, 0, 0),
		cachedPosition: t.clone(),
		cachedMovement: new e.Vector3(0, 0, 0)
	};
}
function Vn(e) {
	let t = lr(e.parentRotation.clone().multiply(e.initialLocalRotation)), n = Fn(e.boneAxis, t);
	return L(n.multiplyScalar(Math.fround(e.springLength))), L(e.headPosition.clone().add(n));
}
function Hn(e, t) {
	let n = Math.fround;
	L(e.currTipPos), L(e.prevTipPos);
	let r = e.currTipPos.clone(), i = L(L(Vn(t).sub(e.currTipPos)).multiplyScalar(n(t.stiffnessForce))), a = L(L(L(t.springForce.clone().add(t.externalForce)).add(i)).multiplyScalar(n(.5 * n(t.deltaTime) * n(t.deltaTime)))), o = L(L(e.currTipPos.clone().sub(e.prevTipPos)).multiplyScalar(n(1 - n(t.dragForce))));
	L(e.currTipPos.add(L(a.add(o)))), e.prevTipPos.copy(r);
	let s = L(t.headPosition.clone()), c = L(e.currTipPos.clone().sub(s));
	Math.fround(c.length()) <= Rn && c.copy(t.lengthFallbackDirection ?? t.boneAxis), ur(c), L(c.multiplyScalar(n(t.springLength))), e.currTipPos.copy(L(c.add(s)));
}
function Un(e, t) {
	let n = L(t.clone());
	L(e.cachedMovement.copy(n).sub(e.cachedPosition)), e.cachedPosition.copy(n);
}
function Wn(t, n, r, i, a, o = zn) {
	let s = r.clone().sub(n), c = s.length();
	if (c <= Rn) {
		s.copy(o).normalize(), t.copy(n).addScaledVector(s, i);
		return;
	}
	let l = e.MathUtils.clamp(c, i, a);
	t.copy(n).addScaledVector(s, l / c);
}
function Gn(t) {
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
function Kn(e, t) {
	let n = 0, r = null, i = e.currTipPos.clone();
	for (let i of hr(t.colliders)) {
		if (i.enabled === !1) continue;
		let a = Yn(i, t.headPosition, e.currTipPos, t.tailRadius, t.springLength);
		t.onColliderCheck?.(i, {
			status: a.status,
			beforeTailPosition: e.currTipPos.clone(),
			afterTailPosition: a.tailPosition.clone(),
			hitNormal: a.hitNormal.clone(),
			details: qn(i, t.headPosition, e.currTipPos, a.tailPosition, t.tailRadius)
		}), a.status !== 0 && (e.currTipPos.copy(a.tailPosition), e.hitNormal.copy(a.hitNormal), r = a.hitNormal, n = a.status, t.onCollision?.(i, a));
	}
	return r && or(e, r, t.bounce, t.friction, i), n;
}
function qn(e, t, n, r, i) {
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
function Jn(e, t) {
	let n = t.headPosition.clone();
	n.y -= t.groundHeight;
	let r = e.currTipPos.clone();
	return r.y -= t.groundHeight, Zn(n, e.currTipPos.distanceTo(t.headPosition), r, t.tailRadius, 1) === 0 ? !1 : (r.y += t.groundHeight, Wn(e.currTipPos, t.headPosition, r, t.springLength * .5, t.springLength, t.lengthFallbackDirection), e.prevTipPos.copy(e.currTipPos), e.hitNormal.set(0, 1, 0), !0);
}
function Yn(e, t, n, r, i) {
	return e.kind === "sphere" ? $n(t, n, r, e) : e.kind === "capsule" ? er(t, n, r, e.start, e.end, e.radius) : e.kind === "panel" ? Xn(t, n, r, i, e) : tr(t, n, r, e);
}
function Xn(t, n, r, i, a) {
	let o = n.clone().applyMatrix4(a.worldToLocalMatrix), s = r;
	if (o.z >= s) return R(n);
	let c = a.width * .5, l = a.height * .5;
	if (Math.abs(o.x) >= c + s || Math.abs(o.y) >= l + s) return R(n);
	let u = t.clone().applyMatrix4(a.worldToLocalMatrix), d = i, f = 0, p = o.clone();
	if (o.z > 0 || u.z > 0) if (Math.abs(o.y) <= l && Math.abs(o.x) <= c) {
		if (f = Zn(u, d, p, s, 2), f === 0) return R(n);
	} else if (Math.abs(o.y) > l) {
		let t = o.y >= 0 ? l : -l, n = new e.Vector3(0, o.y - t, o.z);
		n.lengthSq() <= I * I ? n.set(0, 0, 0) : n.normalize(), p.set(o.x + n.x * s, t + n.y * s, n.z * s), f = 2;
	} else {
		let t = o.x >= 0 ? c : -c, n = new e.Vector3(o.x - t, 0, o.z);
		n.lengthSq() <= I * I ? n.set(0, 0, 0) : n.normalize(), p.set(t + n.x * s, o.y + n.y * s, n.z * s), f = 2;
	}
	else Math.abs(u.y) <= l ? Math.abs(u.x) <= c ? (f = 1, p.set(u.x, u.y, s)) : (f = 2, p.set(o.x < 0 ? -c : c, o.y, o.z)) : (f = 2, p.set(o.x, o.y >= 0 ? l : -l, o.z));
	return {
		status: f,
		tailPosition: p.applyMatrix4(a.localToWorldMatrix),
		hitNormal: _r(new e.Vector3(0, 0, 1), a.localToWorldMatrix)
	};
}
function Zn(e, t, n, r, i) {
	if (B(n, i) >= r) return 0;
	let a = B(e, i);
	if (a + t <= r) return n.copy(e), vr(n, i, a + t), 1;
	let o = (i + 1) % 3, s = (i + 2) % 3, c = B(n, o) - B(e, o), l = B(n, s) - B(e, s), u = Math.sqrt(c * c + l * l);
	if (u > .001) {
		let d = a - r, f = Math.sqrt(t * t - d * d) / u;
		vr(n, o, B(e, o) + c * f), vr(n, s, B(e, s) + l * f), vr(n, i, r);
	} else n.copy(e);
	return 2;
}
function Qn(t, n, r, i, a, o = a, s = {}) {
	let c = r + a, l = n.clone().sub(i);
	if (l.lengthSq() >= c * c) return R(n);
	if (t.distanceToSquared(i) <= o * o) {
		let n = s.headEmbeddedFallback === !1 ? l.clone().multiplyScalar(1 / Math.sqrt(l.lengthSq())) : z(l, s.headEmbeddedFallback instanceof e.Vector3 ? s.headEmbeddedFallback : t.clone().sub(i).lengthSq() <= I * I ? new e.Vector3(0, 1, 0) : t.clone().sub(i));
		return {
			status: 1,
			tailPosition: i.clone().addScaledVector(n, c),
			hitNormal: n
		};
	}
	let u = ir(t, n.distanceTo(t), i, c);
	if (!u) return s.noIntersectionStatus === 2 ? {
		status: 2,
		tailPosition: n.clone(),
		hitNormal: z(n.clone().sub(i), l)
	} : R(n);
	let d = ar(u, n);
	return {
		status: 2,
		tailPosition: d,
		hitNormal: z(d.clone().sub(i), l)
	};
}
function $n(e, t, n, r) {
	let i = e.clone().applyMatrix4(r.worldToLocalMatrix), a = t.clone().applyMatrix4(r.worldToLocalMatrix), o = n, s = Math.abs(r.lossyScaleX) * r.radius, c = Qn(i, a, o, r.localOffset, s, s, {
		headEmbeddedFallback: !1,
		noIntersectionStatus: 2
	});
	return c.status === 0 ? R(t) : {
		status: c.status,
		tailPosition: c.tailPosition.clone().applyMatrix4(r.localToWorldMatrix),
		hitNormal: _r(c.hitNormal.clone(), r.localToWorldNormalMatrix)
	};
}
function er(t, n, r, i, a, o) {
	let s = a.clone().sub(i), c = s.lengthSq();
	if (c <= I * I) return Qn(t, n, r, i, o);
	let l = e.MathUtils.clamp(n.clone().sub(i).dot(s) / c, 0, 1), u = i.clone().addScaledVector(s, l), d = r + o, f = n.clone().sub(u);
	if (f.lengthSq() >= d * d) return R(n);
	if (l <= I) return Qn(t, n, r, i, o);
	if (l >= 1 - I) return Qn(t, n, r, a, o);
	let p = z(f, t.clone().sub(u)), m = e.MathUtils.clamp(t.clone().sub(i).dot(s) / c, 0, 1), h = i.clone().addScaledVector(s, m);
	return {
		status: t.distanceToSquared(h) <= o * o ? 1 : 2,
		tailPosition: u.addScaledVector(p, d),
		hitNormal: p
	};
}
function tr(e, t, n, r) {
	let i = nr(e.clone().applyMatrix4(r.worldToLocalMatrix), t.clone().applyMatrix4(r.worldToLocalMatrix), n, r.localStart, r.localEnd, r.radius, r.lossyScaleX);
	if (i.status === 0) return R(t);
	let a = i.tailPosition.clone().applyMatrix4(r.localToWorldMatrix), o = _r(i.hitNormal, r.localToWorldNormalMatrix);
	return {
		status: i.status,
		tailPosition: a,
		hitNormal: o
	};
}
function nr(t, n, r, i, a, o, s = 1) {
	if (o <= 1e-4) return R(n);
	let c = i.y <= a.y ? i : a, l = i.y <= a.y ? a : i, u = c.y, d = l.y;
	return n.y <= u || n.y >= d ? Qn(t, n, r, n.y < d ? c : l, o, Math.abs(s) * o, {
		headEmbeddedFallback: new e.Vector3(0, 0, 0),
		noIntersectionStatus: 2
	}) : rr(t, n, r, o, s);
}
function rr(t, n, r, i, a = 1) {
	let o = i + r, s = n.x * n.x + n.z * n.z;
	if (s > o * o) return R(n);
	let c = Math.sqrt(s), l = c > I ? n.x / c : 0, u = c > I ? n.z / c : 0, d = new e.Vector3(o * l, n.y, o * u), f = new e.Vector3(l, 0, u), p = t.x * t.x + t.z * t.z, m = Math.abs(a) * i;
	return {
		status: p <= m * m ? 1 : 2,
		tailPosition: d,
		hitNormal: f
	};
}
function ir(e, t, n, r) {
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
function ar(e, t) {
	let n = t.clone().sub(e.origin), r = e.origin.clone().addScaledVector(e.upVector, n.dot(e.upVector)), i = t.clone().sub(r), a = i.length();
	return a <= I || e.radius <= I ? e.origin.clone() : e.origin.clone().addScaledVector(i, e.radius / a);
}
function or(e, t, n, r, i = e.currTipPos) {
	let a = z(t, zn), o = e.prevTipPos.clone(), s = i.clone().sub(o), c = a.clone().multiplyScalar(s.dot(a)), l = s.sub(c).multiplyScalar(1 - r).sub(c.multiplyScalar(n));
	if (l.lengthSq() <= 1e-4) {
		e.prevTipPos.copy(e.currTipPos);
		return;
	}
	e.prevTipPos.copy(e.currTipPos).sub(l);
	let u = e.currTipPos.distanceTo(o), d = l.length(), f = Math.max(d - u, 0);
	f > 0 && e.currTipPos.addScaledVector(l, f / d);
}
function sr(e) {
	if (!e.limit.active) return !1;
	let t = Math.fround, n = e.vector, r = L(e.basisUp.clone()), i = L(e.basisSide.clone()), a = L(e.basisForward.clone());
	L(n);
	let o = t(r.dot(n)), s = L(r.multiplyScalar(o)), c = L(n.clone().sub(s)), l = t(c.length()), u = l <= I ? c.set(0, 0, 0) : c.set(t(c.x / l), t(c.y / l), t(c.z / l)), d = t(i.dot(u)), f = t(Math.asin(d < -1 ? -1 : Number.isNaN(d) ? 1 : Math.min(d, 1))) * t(180 / Math.PI), p = t(f - f * t(e.springStrength) * t(e.deltaTime) * t(e.deltaTime)), m = p <= e.limit.max ? p : e.limit.max, h = p < e.limit.min ? e.limit.min : m, g = h >= 0 ? e.limit.max : e.limit.min, _ = 0;
	if (g < -1e-4 || g > 1e-4) {
		let e = t(h / g);
		e >= 0 && (_ = Math.min(e, 1));
	}
	let v = t(g * _), y = t(g * _ * t(Math.PI / 180)), b = L(i.multiplyScalar(t(Math.sin(y))));
	return L(b.add(L(a.multiplyScalar(t(Math.cos(y)))))), L(b.multiplyScalar(l)), L(n.copy(s).add(b)), v !== p;
}
function cr(t, n, r, i, a) {
	let o = Math.fround, s = r.clone().multiply(i);
	lr(s);
	let c = Fn(new e.Vector3(o(o(n.x) - o(t.x)), o(o(n.y) - o(t.y)), o(o(n.z) - o(t.z))), s.invert());
	if (c.lengthSq() <= I * I) return i.clone();
	ur(c);
	let l = dr(a, c);
	return i.clone().multiply(l);
}
function L(e) {
	return e.set(Math.fround(e.x), Math.fround(e.y), Math.fround(e.z));
}
function lr(e) {
	return e.set(Math.fround(e.x), Math.fround(e.y), Math.fround(e.z), Math.fround(e.w));
}
function ur(e) {
	L(e);
	let t = Math.fround(e.length());
	return t > 1e-5 ? e.set(Math.fround(e.x / t), Math.fround(e.y / t), Math.fround(e.z / t)) : e.set(0, 0, 0);
}
function dr(t, n) {
	let r = Math.fround, i = mr(t.clone()), a = mr(n.clone()), o = pr(i, a);
	if (i.lengthSq() === 0 || a.lengthSq() === 0 || o > .999999) return new e.Quaternion();
	let s = Array(9);
	if (o < -.999999) {
		let t = new e.Vector3(0, i.z, -i.y);
		pr(t, t) < 1e-6 && t.set(-i.z, 0, i.x);
		let n = r(1 / r(Math.sqrt(pr(t, t))));
		L(t.multiplyScalar(n));
		let a = fr(t, i), o = i.toArray(), c = t.toArray(), l = a.toArray();
		for (let e = 0; e < 3; e++) for (let t = 0; t < 3; t++) s[e * 3 + t] = r(r(r(l[t] * l[e]) - r(o[t] * o[e])) - r(c[t] * c[e]));
	} else {
		let e = fr(i, a), t = r(r(1 - o) / pr(e, e)), n = r(e.x * t), c = r(e.y * t), l = r(e.z * t), u = r(e.y * n), d = r(e.z * n), f = r(e.y * l);
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
function fr(t, n) {
	let r = Math.fround;
	return new e.Vector3(r(r(t.y * n.z) - r(t.z * n.y)), r(r(t.z * n.x) - r(t.x * n.z)), r(r(t.x * n.y) - r(t.y * n.x)));
}
function pr(e, t) {
	let n = Math.fround;
	return n(n(n(e.x * t.x) + n(e.y * t.y)) + n(e.z * t.z));
}
function mr(e) {
	let t = Math.fround;
	e.set(t(e.x), t(e.y), t(e.z));
	let n = t(Math.sqrt(pr(e, e)));
	return n >= Math.fround(1e-5) ? e.set(t(e.x / n), t(e.y / n), t(e.z / n)) : e.set(0, 0, 0);
}
function R(t) {
	return {
		status: 0,
		tailPosition: t.clone(),
		hitNormal: new e.Vector3(0, 0, 0)
	};
}
function hr(e) {
	return [...e].sort((e, t) => gr(e) - gr(t));
}
function gr(e) {
	return e.kind === "capsule" || e.kind === "capsuleLocal" ? 0 : e.kind === "sphere" ? 1 : 2;
}
function z(e, t) {
	return e.lengthSq() <= I * I && e.copy(t), e.lengthSq() <= I * I && e.copy(zn), e.normalize();
}
function _r(e, t) {
	let n = t.elements, r = e.x, i = e.y, a = e.z;
	return e.set(n[0] * r + n[4] * i + n[8] * a, n[1] * r + n[5] * i + n[9] * a, n[2] * r + n[6] * i + n[10] * a), z(e, zn);
}
function B(e, t) {
	return t === 0 ? e.x : t === 1 ? e.y : e.z;
}
function vr(e, t, n) {
	t === 0 ? e.x = n : t === 1 ? e.y = n : e.z = n;
}
//#endregion
//#region src/engine/unityPrefabSpringRuntimeAdapter.ts
var yr = 1401298464324817e-60, br = kn("right"), xr = kn("left"), Sr = kn("back"), Cr = kn("down"), wr = class t {
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
		let r = hi(e);
		if (!r) return null;
		n.updateMatrixWorld(!0);
		let i = Hr(n), a = Vr(r), o = Kr(n), s = [], c = Qr(r), l = jr(r, i, s, c), u = Jr(r), d = Yr(r), f = Xr(r, l), p = qr(r), m = Nr(r), h = Mr(r, c, m), g = /* @__PURE__ */ new Map(), _ = /* @__PURE__ */ new Map(), v = /* @__PURE__ */ new Map(), y = /* @__PURE__ */ new Map();
		n.traverse((e) => y.set(e, y.size));
		let b = /* @__PURE__ */ new Map();
		for (let e of p.values()) b.set(e, V(i, e.nodePath, e.runtimePartIndex));
		let x = (r.managers ?? []).filter((e) => $r(e.nodePath ?? e.poseRoot, c)).map((e) => ({
			source: e,
			node: V(i, e.nodePath, e.runtimePartIndex),
			nodes: []
		})).sort((e, t) => (y.get(e.node) ?? 0) - (y.get(t.node) ?? 0));
		for (let e of x) {
			let t = e.source, n = Dr(i, t, v), o = e.node ? [...b].filter(([n, r]) => r ? zi(r, e.node) : n.pathId !== void 0 && t.bonePathIds?.includes(n.pathId)).sort((e, t) => (y.get(e[1]) ?? Infinity) - (y.get(t[1]) ?? Infinity)).map(([e]) => e) : (t.bonePathIds ?? []).map((e) => p.get(e));
			for (let p of o) {
				if (!p || !$r(p.nodePath, c)) continue;
				let o = p.pathId;
				if (!Fr(p, m)) {
					h.rejectedUnverifiedBoneSourceCount += 1;
					continue;
				}
				let v = b.get(p);
				if (!v) {
					s.push(p.nodePath ?? p.nodeName ?? `bone:${o}`);
					continue;
				}
				e.nodes.push(v), _.set(v, p);
				let y = Lr(p, v, a, i), x = V(i, p.pivotNodePath, p.runtimePartIndex), ee = Ir(r, t, p, o === void 0 ? void 0 : u.get(o), o === void 0 ? void 0 : d.get(o), t.pathId === void 0 ? void 0 : f.get(t.pathId), l), te = Er(t, p, v, y, x, ei(i, p), n, ee);
				te && g.set(v, te);
			}
		}
		let ee = [...g.values()];
		ee.sort((e, t) => Ri(e.node) - Ri(t.node));
		let te = x.map((e) => {
			let t = [...new Set(e.nodes)].map((e) => g.get(e)).sort((e, t) => Ri(e.node) - Ri(t.node));
			return {
				source: e.source,
				bones: t,
				animatedBones: new Set(t.filter((t) => fi(_.get(t.node), t.node, e.source))),
				gravity: K(e.source.rawGravity),
				forceProviders: Dr(i, e.source, v),
				slowMotionScale: J(e.source.slowMotionScale) ?? 1,
				isPaused: e.source.isPaused === !0
			};
		});
		return ee.length > 0 ? new t(ee, te, s, o, h) : null;
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
		for (let t of this.managerBatches) t.slowMotionScale = ji(e.slowMotionScale, 1), t.isPaused = e.paused ?? !1;
		for (let t of this.bones) t.stiffnessForce = ji(e.stiffnessForce, t.originalStiffnessForce), t.dragForce = ji(e.dragForce, t.originalDragForce), t.windInfluence = ji(e.windInfluence, t.originalWindInfluence), t.slowMotionScale = ji(e.slowMotionScale, 1), t.isPaused = e.paused ?? !1;
	}
	clearTimelineControl() {
		this.setTimelineControl({});
	}
	update(t) {
		let n = this.collectWindVolumeOneSelfProviders(), r = new Set(n.filter((e) => e.isActive && e.springManagerPathId !== null).map((e) => e.springManagerPathId)), i = new Set(n.filter((e) => !e.isActive && e.springManagerPathId !== null).map((e) => e.springManagerPathId));
		for (let n of this.managerBatches) {
			let a = n.source;
			if (a.enabled === !1 || a.automaticUpdates === !1) continue;
			this.updateManagerPathId = J(a.pathId), n.isPaused || this.preUpdateColliders(n.bones);
			let o = this.updateManagerPathId !== null && i.has(this.updateManagerPathId) ? !0 : a.isSumOfForcesOnBone !== !1;
			for (let i of n.bones) {
				if (!i.enabled) continue;
				N(i.node.parent, this.parentRotation), P(i.node, this.headPosition);
				let s = n.animatedBones.has(i) ? e.MathUtils.clamp(J(a.dynamicRatio) ?? .5, 0, 1) : 1;
				if (n.isPaused) {
					i.skinAnimationLocalRotation.copy(i.node.quaternion), this.applyBoneRotation(i, s);
					continue;
				}
				!o || this.updateManagerPathId !== null && r.has(this.updateManagerPathId) || (this.computeExternalForce(i, t, n), this.updateBoneSpringAndRotation(i, mi(t, J(a.simulationFrameRate) ?? 60, n.slowMotionScale), this.externalForce, s));
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
		return e.kind === "ForceVolume" ? (e.node.updateMatrixWorld(!0), N(e.node, this.providerRotation), this.providerForce.set(0, 0, 1).applyQuaternion(this.providerRotation).multiplyScalar(e.strength)) : e.kind === "WindVolume" ? this.computeWindVolume(e, t) : this.computeWindVolumeOneSelfForce(e, t, n);
	}
	computeWindVolume(e, t) {
		let n = e.weight * e.strength;
		if (n <= yr || e.period <= .001) return this.providerForce.set(0, 0, 0);
		e.node.updateMatrixWorld(!0), N(e.node, this.providerRotation), t.node.getWorldPosition(this.localBonePosition).applyMatrix4(this.providerWorldToLocal.copy(e.node.matrixWorld).invert());
		let r = -this.localBonePosition.x, i = Math.sin(e.timeFactor + Math.sin(r * e.positionalMultiplier) + Math.cos(this.localBonePosition.z * e.positionalMultiplier));
		return this.providerForce.set(0, 0, 1).applyQuaternion(this.providerRotation).addScaledVector(e.offsetVector, i).normalize().multiplyScalar(n * t.windInfluence);
	}
	computeWindVolumeOneSelfForce(t, n, r) {
		let i = t.weight * t.strength;
		if (i <= yr || t.period <= yr) return this.providerForce.set(0, 0, 0);
		t.currentTime = Ai(t.currentTime, r, t.period);
		let a = t.currentTime * Math.PI * 2 / t.period;
		if (t.node.updateMatrixWorld(!0), N(t.node, this.providerRotation), this.waveAxis.set(0, 1, 0).applyQuaternion(this.providerRotation), Math.abs(t.spinPeriod) > .001) {
			t.spinTime = Ai(t.spinTime, r, t.spinPeriod);
			let e = t.spinTime * Math.PI * 2 / t.spinPeriod;
			this.providerRight.copy(br).applyQuaternion(this.providerRotation), this.providerUp.set(0, 1, 0).applyQuaternion(this.providerRotation), this.waveAxis.copy(this.providerRight).multiplyScalar(Math.cos(e)).addScaledVector(this.providerUp, Math.sin(e));
		}
		let o = Math.max(t.peakDistance, yr);
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
		for (let e of this.bones) N(e.node.parent, this.parentRotation), P(e.node, this.headPosition), e.skinAnimationLocalRotation.copy(e.node.quaternion), this.debugAnimatedTip.copy(Vn({
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
			N(t.node.parent, this.parentRotation), P(t.node, this.headPosition), this.debugAnimatedTip.copy(Vn({
				headPosition: this.headPosition,
				parentRotation: this.parentRotation,
				initialLocalRotation: t.initialLocalRotation,
				boneAxis: t.boneAxis,
				springLength: t.springLength
			}));
			let n = this.debugAnimatedTip.distanceTo(t.state.currTipPos), u = t.node.name.toLowerCase(), d = t.state.currTipPos.clone().sub(this.debugAnimatedTip), f = t.state.currTipPos.clone().sub(t.state.prevTipPos), p = this.skinnedBones.has(t.node);
			u.includes("sleeve") && (o = Math.max(o, n)), u.includes("skirt") && (s = Math.max(s, n)), p ? c += 1 : l += 1, i.push({
				name: t.node.name,
				path: Y(t.node),
				springName: t.springName,
				sourceBoneName: t.sourceBoneName,
				sourceBonePath: t.sourceBonePath,
				sourceBonePathId: t.sourceBonePathId,
				resolvedIsSkinnedBone: p,
				pivotSourceName: t.pivotSourceName,
				pivotSourcePath: t.pivotSourcePath,
				pivotResolvedPath: t.pivotResolvedPath,
				tailBinding: Si(t.tailBinding),
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
				dynamicRatio: di(t),
				isAnimated: t.isAnimated,
				automaticUpdates: t.automaticUpdates,
				boneEnabled: t.enabled,
				bonePaused: t.isPaused,
				isSumOfForcesOnBone: t.isSumOfForcesOnBone,
				simulationFrameRate: t.simulationFrameRate,
				slowMotionScale: t.slowMotionScale,
				updateSkipReason: _i(t),
				animatedTipDelta: U(d),
				velocity: U(f),
				springForce: U(t.springForce),
				colliderBindings: t.colliderBindingDiagnostics.map(oi)
			}), u.includes("skirt") && a.push({
				name: t.node.name,
				path: Y(t.node),
				springName: t.springName,
				sourceBoneName: t.sourceBoneName,
				sourceBonePath: t.sourceBonePath,
				sourceBonePathId: t.sourceBonePathId,
				resolvedIsSkinnedBone: p,
				pivotSourceName: t.pivotSourceName,
				pivotSourcePath: t.pivotSourcePath,
				pivotResolvedPath: t.pivotResolvedPath,
				tailBinding: Si(t.tailBinding),
				offset: n,
				appliedRotationDegrees: e.MathUtils.radToDeg(t.skinAnimationLocalRotation.clone().normalize().angleTo(t.node.quaternion.clone().normalize())),
				colliderCount: t.colliders.length,
				lastCollisionStatus: t.lastCollisionStatus,
				lastCollisionColliderName: t.lastCollisionInfo?.name ?? null,
				lastCollisionColliderPath: t.lastCollisionInfo?.path ?? null,
				lastCollisionColliderKind: t.lastCollisionInfo?.kind ?? null,
				lastCollisionColliderSourcePathId: t.lastCollisionInfo?.sourcePathId ?? null,
				lastCollisionHitNormal: t.lastCollisionInfo ? U(t.lastCollisionInfo.hitNormal) : null,
				lastAngleLimitApplied: t.lastAngleLimitApplied,
				hasSpringForce: t.springForce.lengthSq() > 1e-8,
				forceProviderCount: t.forceProviders.length,
				stiffnessForce: t.stiffnessForce,
				dragForce: t.dragForce,
				managerDynamicRatio: t.dynamicRatio,
				dynamicRatio: di(t),
				isAnimated: t.isAnimated,
				automaticUpdates: t.automaticUpdates,
				boneEnabled: t.enabled,
				bonePaused: t.isPaused,
				isSumOfForcesOnBone: t.isSumOfForcesOnBone,
				simulationFrameRate: t.simulationFrameRate,
				slowMotionScale: t.slowMotionScale,
				updateSkipReason: _i(t),
				animatedTipDelta: U(d),
				velocity: U(f),
				headMovement: U(t.state.cachedMovement),
				gravity: U(t.gravity),
				springForce: U(t.springForce),
				colliderBindings: t.colliderBindingDiagnostics.map(oi)
			});
		}
		i.sort((e, t) => t.offset - e.offset), a.sort((e, t) => t.offset - e.offset);
		let u = gi(i, n), d = Tr(this.bones, this.skinnedBones);
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
			bindingDiagnostics: this.bones.flatMap((e) => e.colliderBindingDiagnostics).map(oi),
			skinnedBoneMatches: c,
			skinnedBoneMisses: l
		};
	}
	updateBoneSpringAndRotation(t, n, r, i) {
		N(t.node.parent, this.parentRotation), P(t.node, this.headPosition);
		let a = this.shouldTraceBone(t) ? this.createTraceEvent(t, n, r, i) : null;
		t.skinAnimationLocalRotation.copy(t.node.quaternion), a && (a.skinAnimationLocalRotation = yi(t.skinAnimationLocalRotation)), Un(t.state, this.headPosition), a && (a.stateAfterCache = W(t.state)), Hn(t.state, {
			headPosition: this.headPosition,
			parentRotation: this.parentRotation,
			initialLocalRotation: t.initialLocalRotation,
			boneAxis: t.boneAxis,
			lengthFallbackDirection: t.boneAxis.clone().applyQuaternion(N(t.node, new e.Quaternion())),
			springLength: t.springLength,
			stiffnessForce: t.stiffnessForce,
			dragForce: t.dragForce,
			springForce: t.springForce,
			externalForce: r,
			deltaTime: n
		}), a && (a.stateAfterUpdateSpring = W(t.state)), this.applyLengthLimits(t, n), a && (a.stateAfterLengthLimits = W(t.state));
		let o = Math.abs(t.radius);
		a && (a.tailRadius = o);
		let s = t.collideWithGround ? Jn(t.state, {
			headPosition: this.headPosition,
			springLength: t.springLength,
			tailRadius: o,
			groundHeight: t.groundHeight,
			lengthFallbackDirection: t.boneAxis.clone().applyQuaternion(N(t.node, new e.Quaternion())),
			bounce: t.bounce,
			friction: t.friction
		}) : !1;
		a && (a.groundHit = s, a.stateAfterGround = W(t.state)), t.lastCollisionInfo = null;
		let c = [], l = t.enableCollision ? this.buildWorldColliders(t.colliders) : [];
		t.lastCollisionStatus = !s && t.enableCollision ? Kn(t.state, {
			headPosition: this.headPosition,
			springLength: t.springLength,
			tailRadius: o,
			colliders: l,
			bounce: t.bounce,
			friction: t.friction,
			onColliderCheck: a ? (e, t) => {
				c.push(xi(e, t));
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
		}) : 0, a && (a.collisionChecks = c, a.collisionStatus = t.lastCollisionStatus, a.stateAfterCollisions = W(t.state));
		let u = a ? bi(t) : void 0;
		t.lastAngleLimitApplied = t.enableAngleLimits ? this.applyAngleLimits(t, n, u) : !1, a && u && (a.angleLimit = u, a.stateAfterAngleLimits = W(t.state)), this.resetInvalidTipPosition(t), this.applyBoneRotation(t, i), a && (a.finalLocalRotation = yi(t.node.quaternion), this.pushTraceEvent(a));
	}
	applyLengthLimits(t, n) {
		if (!t.enableLengthLimits || t.lengthLimitTargets.length === 0) return;
		let r = t.lengthLimitTargets.map((t) => ({
			position: P(t.node, new e.Vector3()),
			initialLength: t.initialLength
		}));
		Gn({
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
		let i = Pn(r, xr.clone()), a = Pn(r, Sr.clone()), o = Pn(r, Cr.clone());
		n && (n.enabled = !0, n.hasPivot = !0, n.pivotName = r.name || null, n.pivotPath = Y(r) || null, n.vectorBefore = U(this.angleVector), n.forward = U(i), n.back = U(a), n.down = U(o));
		let s = !1;
		if (e.yAngleLimit) {
			let r = sr({
				basisSide: o,
				basisUp: a,
				basisForward: i,
				springStrength: e.angularStiffness,
				deltaTime: t,
				limit: e.yAngleLimit,
				vector: this.angleVector
			});
			n && (n.yApplied = r, n.afterY = U(this.angleVector)), s = r || s;
		}
		if (e.zAngleLimit) {
			let r = sr({
				basisSide: a,
				basisUp: o,
				basisForward: i,
				springStrength: e.angularStiffness,
				deltaTime: t,
				limit: e.zAngleLimit,
				vector: this.angleVector
			});
			n && (n.zApplied = r, n.afterZ = U(this.angleVector)), s = r || s;
		}
		return e.state.currTipPos.copy(e.state.cachedPosition).add(this.angleVector), e.state.currTipPos.set(Math.fround(e.state.currTipPos.x), Math.fround(e.state.currTipPos.y), Math.fround(e.state.currTipPos.z)), n && (n.vectorAfter = U(this.angleVector)), s;
	}
	applyBoneRotation(e, t = e.dynamicRatio) {
		this.resetInvalidTipPosition(e), this.localRotation.copy(cr(this.headPosition, e.state.currTipPos, this.parentRotation, e.initialLocalRotation, e.boneAxis)), e.node.quaternion.copy(Tn(In(e.skinAnimationLocalRotation, this.localRotation, t))), e.node.updateMatrix(), e.node.updateMatrixWorld(!0);
	}
	resetInvalidTipPosition(e) {
		Number.isFinite(e.state.currTipPos.x) && Number.isFinite(e.state.currTipPos.y) && Number.isFinite(e.state.currTipPos.z) || (this.debugAnimatedTip.copy(Vn({
			headPosition: this.headPosition,
			parentRotation: this.parentRotation,
			initialLocalRotation: e.initialLocalRotation,
			boneAxis: e.boneAxis,
			springLength: e.springLength
		})), e.state.currTipPos.copy(this.debugAnimatedTip), e.state.prevTipPos.copy(this.debugAnimatedTip));
	}
	shouldTraceBone(e) {
		if (this.traceFilters.length === 0) return !1;
		let t = e.node.name.toLowerCase(), n = Y(e.node).toLowerCase(), r = e.springName.toLowerCase();
		return this.traceFilters.some((e) => t.includes(e) || n.includes(e) || r.includes(e));
	}
	createTraceEvent(e, t, n, r) {
		return {
			sequence: this.traceSequence,
			springName: e.springName,
			boneName: e.node.name,
			bonePath: Y(e.node),
			sourceBoneName: e.sourceBoneName,
			sourceBonePath: e.sourceBonePath,
			sourceBonePathId: e.sourceBonePathId,
			pivotSourceName: e.pivotSourceName,
			pivotSourcePath: e.pivotSourcePath,
			pivotResolvedPath: e.pivotResolvedPath,
			tailBinding: Si(e.tailBinding),
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
			headPosition: U(this.headPosition),
			parentRotation: yi(this.parentRotation),
			initialLocalRotation: yi(e.initialLocalRotation),
			skinAnimationLocalRotation: yi(e.skinAnimationLocalRotation),
			boneAxis: U(e.boneAxis),
			boneAxisSource: e.boneAxisSource,
			springLength: e.springLength,
			radius: e.radius,
			tailRadius: 0,
			stiffnessForce: e.stiffnessForce,
			dragForce: e.dragForce,
			springForce: U(e.springForce),
			gravity: U(e.gravity),
			externalForce: U(n),
			stateBefore: W(e.state),
			stateAfterCache: W(e.state),
			animatedTip: U(Vn({
				headPosition: this.headPosition,
				parentRotation: this.parentRotation,
				initialLocalRotation: e.initialLocalRotation,
				boneAxis: e.boneAxis,
				springLength: e.springLength
			})),
			stateAfterUpdateSpring: W(e.state),
			stateAfterLengthLimits: W(e.state),
			groundHit: !1,
			stateAfterGround: W(e.state),
			collisionStatus: 0,
			collisionChecks: [],
			stateAfterCollisions: W(e.state),
			angleLimit: bi(e),
			stateAfterAngleLimits: W(e.state),
			finalLocalRotation: yi(e.node.quaternion)
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
		let n = [...t].sort((e, t) => Fi(e.source) - Fi(t.source));
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
			debugPath: t.source.nodePath ?? Y(t.node),
			debugSourcePathId: t.source.pathId,
			localOffset: K(n.sphere.offset),
			radius: Math.max(0, n.sphere.radius ?? .01),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Li(this.colliderWorldToLocal),
			localToWorldNormalMatrix: new e.Matrix4().makeRotationFromQuaternion(N(t.node, new e.Quaternion())),
			lossyScaleX: Ii(t.node)
		}) : n?.capsule ? (t.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(t.node.matrixWorld), this.colliderWorldToLocal.copy(t.node.matrixWorld).invert(), {
			kind: "capsuleLocal",
			enabled: i,
			debugName: t.source.nodeName ?? t.source.scriptName ?? t.node.name,
			debugPath: t.source.nodePath ?? Y(t.node),
			debugSourcePathId: t.source.pathId,
			localStart: K(n.capsule.offset),
			localEnd: K(n.capsule.tail),
			radius: Math.max(0, n.capsule.radius ?? .01),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Li(this.colliderWorldToLocal),
			localToWorldNormalMatrix: new e.Matrix4().makeRotationFromQuaternion(N(t.node, new e.Quaternion())),
			lossyScaleX: Ii(t.node)
		}) : n?.panel ? (t.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(t.node.matrixWorld), this.colliderWorldToLocal.copy(t.node.matrixWorld).invert(), {
			kind: "panel",
			enabled: i,
			debugName: t.source.nodeName ?? t.source.scriptName ?? t.node.name,
			debugPath: t.source.nodePath ?? Y(t.node),
			debugSourcePathId: t.source.pathId,
			width: Math.max(0, n.panel.width ?? 0),
			height: Math.max(0, n.panel.height ?? 0),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Li(this.colliderWorldToLocal),
			worldToLocalLengthScale: Li(this.colliderWorldToLocal),
			localToWorldNormalMatrix: new e.Matrix4().makeRotationFromQuaternion(N(t.node, new e.Quaternion()))
		}) : null;
	}
};
function Tr(e, t) {
	let n = /* @__PURE__ */ new Map(), r = [];
	for (let i of e) {
		let e = Ci(i.sourceBonePath), a = `${i.runtimePartIndex ?? "null"}|${i.runtimePartType ?? "null"}|${e ?? "null"}`, o = n.get(a);
		o || (o = {
			runtimePartIndex: i.runtimePartIndex,
			runtimePartType: i.runtimePartType,
			sourceRoot: e,
			count: 0,
			sampleNames: [],
			samplePaths: []
		}, n.set(a, o)), o.count += 1, o.sampleNames.length < 6 && (o.sampleNames.push(i.node.name), o.samplePaths.push(Y(i.node))), r.length < 12 && (i.runtimePartType === "hair" || i.node.name.toLowerCase().includes("hair") || (i.sourceBonePath ?? "").toLowerCase().includes("hair")) && r.push({
			name: i.node.name,
			path: Y(i.node),
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
function Er(t, n, r, i, a, o, s, c) {
	let l = i.tailPosition, u = P(r, new e.Vector3()), d = l.clone().sub(u);
	d.set(Math.fround(d.x), Math.fround(d.y), Math.fround(d.z));
	let f = Math.fround(d.length()), p = r.quaternion.clone(), m = wi(r, l), h = e.MathUtils.clamp(J(t.dynamicRatio) ?? .5, 0, 1), g = o.map((t) => ({
		node: t.node,
		initialLength: P(t.node, new e.Vector3()).distanceTo(l)
	})), _ = n.rawStiffnessForce ?? 300, v = n.rawDragForce ?? n.dragForce ?? .4, y = Math.max(0, n.rawWindInfluence ?? 1), b = J(t.slowMotionScale) ?? 1, x = t.isPaused === !0;
	return {
		managerPathId: J(t.pathId),
		runtimePartIndex: J(n.runtimePartIndex) ?? J(t.runtimePartIndex),
		runtimePartType: n.runtimePartType ?? t.runtimePartType ?? n.partKind ?? t.partKind ?? null,
		springName: `${t.partKind ?? n.partKind ?? "Part"}:${t.nodeName ?? t.pathId ?? "manager"}`,
		sourceBoneName: n.nodeName ?? null,
		sourceBonePath: n.nodePath ?? null,
		sourceBonePathId: J(n.pathId),
		pivotSourceName: n.pivotNodeName ?? null,
		pivotSourcePath: n.pivotNodePath ?? null,
		pivotResolvedPath: a ? Y(a) : null,
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
		gravity: K(t.rawGravity),
		forceProviders: s,
		node: r,
		state: Bn(u, l),
		initialLocalRotation: p,
		initialLocalScale: r.scale.clone(),
		skinAnimationLocalRotation: p.clone(),
		boneAxis: m.axis,
		boneAxisSource: m.source,
		springLength: f,
		dynamicRatio: h,
		isAnimated: fi(n, r, t),
		simulationFrameRate: J(t.simulationFrameRate) ?? 60,
		slowMotionScale: b,
		bounce: J(t.bounce) ?? 0,
		friction: J(t.friction) ?? 1,
		radius: Math.max(0, n.hitRadius ?? .05),
		stiffnessForce: _,
		dragForce: v,
		windInfluence: y,
		originalStiffnessForce: _,
		originalDragForce: v,
		originalWindInfluence: y,
		springForce: K(n.rawSpringForce),
		springConstant: n.rawSpringConstant ?? .5,
		lengthLimitTargets: g,
		angularStiffness: Math.max(0, n.rawAngularStiffness ?? 100),
		pivotNode: a,
		yAngleLimit: ui(n.rawAngleLimits?.y),
		zAngleLimit: ui(n.rawAngleLimits?.z),
		colliders: c.colliders,
		colliderBindingDiagnostics: c.diagnostics,
		lastCollisionStatus: 0,
		lastCollisionInfo: null,
		lastAngleLimitApplied: !1
	};
}
function Dr(e, t, n) {
	return (t.forceProviders ?? []).map((t) => {
		let r = Or(t), i = r ? n.get(r) : void 0;
		if (i) return i;
		let a = kr(e, t);
		return a && r && n.set(r, a), a;
	}).filter((e) => !!e);
}
function Or(e) {
	let t = typeof e.runtimePartIndex == "number" ? `${e.runtimePartIndex}:` : "";
	return typeof e.sourcePathId == "number" ? `${t}path:${e.sourcePathId}` : e.nodePath ? `${t}nodePath:${e.nodePath}` : null;
}
function kr(t, n) {
	let r = n.scriptName ?? "", i = r.endsWith("WindVolumeOneSelf"), a = r.endsWith("WindVolume") && !i, o = r.endsWith("ForceVolume") && !a;
	if (!o && !a && !i) return null;
	let s = V(t, n.nodePath, n.runtimePartIndex) ?? Ar(t, n.nodeName), c = n.raw ?? {};
	if (!s || !Di(c, "m_Enabled", !0) || n.activeSelf === !1 || n.activeInHierarchy === !1) return null;
	let l = {
		sourcePathId: J(n.sourcePathId),
		node: s,
		springManagerPathId: J(n.springManagerPathId) ?? Oi(c, "<SpringManager>k__BackingField") ?? Oi(c, "_SpringManager_k__BackingField") ?? Oi(c, "springManager")
	};
	return o ? {
		kind: "ForceVolume",
		...l,
		strength: q(c, "strength", 0)
	} : a ? {
		kind: "WindVolume",
		...l,
		weight: q(c, "weight", 0),
		strength: q(c, "strength", 0),
		period: q(c, "period", 0),
		positionalMultiplier: q(c, "positionalMultiplier", 0),
		timeFactor: q(c, "timeFactor", 0),
		offsetVector: Ei(c, "offsetVector")
	} : {
		kind: "WindVolumeOneSelf",
		...l,
		isActive: Di(c, "isActive", !1),
		dynamicRatio: e.MathUtils.clamp(q(c, "dynamicRatio", .5), 0, 1),
		simulationFrameRate: Math.max(0, q(c, "simulationFrameRate", 60)),
		weight: q(c, "weight", 0),
		strength: q(c, "strength", 0),
		period: q(c, "period", 0),
		currentTime: q(c, "currentTime", 0),
		spinPeriod: q(c, "spinPeriod", 0),
		spinTime: q(c, "spinTime", 0),
		amplitude: q(c, "amplitude", 0),
		peakDistance: q(c, "peakDistance", 0),
		additionalWindAngle: q(c, "additionalWindAngle", 0),
		additionalWindStrength: q(c, "additionalWindStrength", 0)
	};
}
function Ar(e, t) {
	if (!t) return null;
	let n = [...new Set(e.nodeByPath.values())].filter((e) => e.name === t);
	return n.length === 1 ? n[0] : null;
}
function jr(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let a of e.colliders ?? []) {
		if (typeof a.index != "number" || !$r(a.nodePath, r)) continue;
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
function Mr(e, t, n) {
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
function Nr(e) {
	let t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), r = !1;
	for (let i of e.prefabGraphs ?? []) {
		Array.isArray(i.monoBehaviours) && (r = !0);
		for (let e of i.monoBehaviours ?? []) Pr(e.scriptName) && (typeof e.pathId == "number" && t.add(e.pathId), e.transformPath && n.add(H(e.runtimePartIndex ?? -1, e.transformPath)));
	}
	return {
		hasComponentMetadata: r,
		pathIds: t,
		partPaths: n
	};
}
function Pr(e) {
	let t = e?.trim().toLowerCase();
	return t === "springbone" || t === "sekaispringbone";
}
function Fr(e, t) {
	return !t.hasComponentMetadata || typeof e.pathId == "number" && t.pathIds.has(e.pathId) ? !0 : !!(e.nodePath && t.partPaths.has(H(e.runtimePartIndex ?? -1, e.nodePath)));
}
function Ir(e, t, n, r, i, a, o) {
	if (!r && !i) return {
		colliders: [],
		diagnostics: a ? [ai(t, n, r, i, null, null, null, `no per-bone collider binding; manager cache not used as fallback; ${li(a)}`, [])] : []
	};
	let s = i?.sourceKind ?? r?.sourceKind ?? "direct", c = ti(i?.candidateRoots ?? r?.collidersByRoot, o);
	if (s === "colliderFlag" && c.size > 0) {
		let o = ri(c, a), s = ii(e, t, n, i, r, o), l = s.root ? o.get(s.root) ?? [] : [];
		return {
			colliders: l,
			diagnostics: [ai(t, n, r, i, c, i?.defaultRoot ?? r?.defaultRoot, s.root, `${s.reason}; manager cache constrained; ${li(a)}`, l)]
		};
	}
	let l = si((i?.selectedColliderIndexes ?? r?.colliders ?? []).map((e) => o.get(e)).filter((e) => !!e), t, n);
	return {
		colliders: l,
		diagnostics: [ai(t, n, r, i, null, i?.defaultRoot ?? r?.defaultRoot, null, `${i?.selectedColliderIndexes ? "bindingDecision.selectedColliderIndexes" : r?.colliders ? "colliderBinding.colliders" : "no direct collider indexes"} / direct serialized collider references / pose root preference; ${li(a)}`, l)]
	};
}
function Lr(t, n, r, i) {
	n.updateMatrixWorld(!0);
	let a = P(n, new e.Vector3()), o = Pn(n, kn("right")), s = Math.fround, c = new e.Vector3(s(a.x - s(o.x * s(.1))), s(a.y - s(o.y * s(.1))), s(a.z - s(o.z * s(.1)))), l = t.nodePath ? Wr(r, t.nodePath, t.runtimePartIndex) : void 0, u = l ? zr(l, r, i, t.runtimePartIndex) : [], d = u.map((e) => e.source.name ?? e.node.name), f = u.map((e) => e.source.transformPath ?? Y(e.node));
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
		tailPosition: P(u[0].node, new e.Vector3())
	};
	let p = new e.Vector3(), m = 0;
	for (let t of u) {
		let n = P(t.node, new e.Vector3());
		p.add(n), p.set(s(p.x), s(p.y), s(p.z));
		let r = n.clone().sub(a);
		r.set(s(r.x), s(r.y), s(r.z)), m = s(m + s(r.length()));
	}
	p.set(s(p.x / u.length), s(p.y / u.length), s(p.z / u.length)), m = s(m / u.length);
	let h = Rr(a, p, m);
	return {
		mode: "averageChildren",
		childCount: u.length,
		childNames: d,
		childPaths: f,
		childSources: u.map((e) => e.source),
		tailPosition: h
	};
}
function Rr(t, n, r) {
	let i = Math.fround, a = n.clone().sub(t);
	if (a.set(i(a.x), i(a.y), i(a.z)), a.lengthSq() <= 1e-5 * 1e-5) a.copy(br);
	else {
		let e = i(a.length());
		a.set(i(a.x / e), i(a.y / e), i(a.z / e));
	}
	return new e.Vector3(i(t.x + i(a.x * i(r))), i(t.y + i(a.y * i(r))), i(t.z + i(a.z * i(r))));
}
function zr(e, t, n, r) {
	let i = [];
	for (let a of e.childPathIds ?? []) {
		let e = t.transformByPathId.get(a);
		if (!e || !Br(e, t)) continue;
		let o = V(n, e.transformPath, r ?? e.runtimePartIndex);
		o && i.push({
			source: e,
			node: o
		});
	}
	return i;
}
function Br(e, t) {
	return typeof e.pathId == "number" && t.pivotTransformPathIds.has(e.pathId) ? !1 : !e.transformPath || !t.pivotTransformPaths.has(e.transformPath);
}
function Vr(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
	for (let i of e.prefabGraphs ?? []) for (let e of i.transforms ?? []) typeof e.pathId == "number" && t.set(e.pathId, e), e.transformPath && (n.set(e.transformPath, e), typeof e.runtimePartIndex == "number" && r.set(H(e.runtimePartIndex, e.transformPath), e));
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
function Hr(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
	return e.traverse((i) => {
		let a = Y(i, e);
		if (!a) return;
		t.set(a, i);
		let o = Ni(i, e);
		o && o !== a && r.set(o, i);
		let s = Gr(i), c = i.userData.pjskTransformPath;
		for (let e of typeof c == "string" && c.length > 0 ? [c] : []) typeof s == "number" && n.set(H(s, e), i), t.has(e) || t.set(e, i);
	}), {
		nodeByPath: t,
		nodeByPartPath: n,
		canonicalNodeByPath: r
	};
}
function Ur(e, t) {
	return t ? e.nodeByPath.get(t) ?? e.canonicalNodeByPath.get(t) ?? null : null;
}
function V(e, t, n) {
	if (!t) return null;
	if (typeof n == "number") {
		let r = e.nodeByPartPath.get(H(n, t));
		if (r) return r;
	}
	return Ur(e, t);
}
function Wr(e, t, n) {
	return typeof n == "number" ? e.transformByPartPath.get(H(n, t)) ?? e.transformByPath.get(t) : e.transformByPath.get(t);
}
function H(e, t) {
	return `${e}:${t}`;
}
function Gr(e) {
	let t = e.userData.pjskRuntimePartIndex;
	return typeof t == "number" ? t : void 0;
}
function Kr(e) {
	let t = /* @__PURE__ */ new Set();
	return e.traverse((e) => {
		let n = e;
		if (n.isSkinnedMesh) for (let e of n.skeleton.bones) t.add(e);
	}), t;
}
function qr(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.bones ?? []) typeof n.pathId == "number" && t.set(n.pathId, n);
	return t;
}
function Jr(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.colliderBindings ?? []) typeof n.sourceSpringBonePathId == "number" && t.set(n.sourceSpringBonePathId, n);
	return t;
}
function Yr(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.bindingDecisions ?? []) typeof n.sourceSpringBonePathId == "number" && t.set(n.sourceSpringBonePathId, n);
	return t;
}
function Xr(e, t) {
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
			typeof n == "number" && i && Zr(r, i) && e.add(n);
		}
		n.set(r.managerPathId, {
			source: r,
			colliderIndexes: e
		});
	}
	return n;
}
function Zr(e, t) {
	let n = e.managerNodePath ?? "", r = t.source.nodePath ?? "", i = t.source.shape;
	return n.endsWith("/Position/PositionOffset/Hip") ? i?.sphere ? /\/(?:Left_Thigh|Right_Thigh)\/CL_/.test(r) || /\/Hip\/CL_HipSphereCollider$/.test(r) : !1 : !0;
}
function Qr(e) {
	return new Set((e.activeRootProfile?.activeRoots ?? []).map((e) => G(e)).filter((e) => !!e));
}
function $r(e, t) {
	if (t.size === 0) return !0;
	let n = G(Ci(e));
	return n !== null && t.has(n);
}
function ei(e, t) {
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
function ti(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let [r, i] of Object.entries(e ?? {})) {
		let e = i.map((e) => t.get(e)).filter((e) => !!e);
		e.length > 0 && n.set(r, e);
	}
	return n;
}
function ni(e, t) {
	return !t || t.colliderIndexes.size === 0 ? e : e.filter((e) => typeof e.source.index == "number" && t.colliderIndexes.has(e.source.index));
}
function ri(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let [r, i] of e.entries()) {
		let e = ni(i, t);
		e.length > 0 && n.set(r, e);
	}
	return n;
}
function ii(e, t, n, r, i, a) {
	if (a.size === 1) return {
		root: a.keys().next().value,
		reason: "single manager-cache root"
	};
	let o = G(Ci(n.nodePath));
	if (o && a.has(o)) return {
		root: o,
		reason: "joint root matched candidate root"
	};
	if (t.partKind === "Head" || o === "face") {
		let t = G(e.rootSelectionProfile?.defaultBodyRoot ?? e.activeRootProfile?.defaultBodyRoot);
		if (t && a.has(t)) return {
			root: t,
			reason: "head/face uses runtime defaultBodyRoot"
		};
		if (a.has("body")) return {
			root: "body",
			reason: "head/face body fallback"
		};
	}
	let s = G(r?.defaultRoot);
	if (s && a.has(s)) return {
		root: s,
		reason: "bindingDecision.defaultRoot"
	};
	for (let t of e.activeRootProfile?.activeRoots ?? []) {
		let e = G(t);
		if (e && a.has(e)) return {
			root: e,
			reason: "activeRootProfile active root"
		};
	}
	let c = G(i?.defaultRoot);
	return c && a.has(c) ? {
		root: c,
		reason: "binding.defaultRoot"
	} : {
		root: null,
		reason: c ? `binding.defaultRoot ${c} not available after manager cache` : "no matching root"
	};
}
function ai(e, t, n, r, i, a, o, s, c) {
	return {
		sourceKind: r?.sourceKind ?? n?.sourceKind ?? "direct",
		colliderFlag: r?.colliderFlag ?? n?.colliderFlag ?? null,
		colliderGroupIndex: null,
		springName: `${e.partKind ?? t.partKind ?? "Part"}:${e.nodeName ?? e.pathId ?? "manager"}`,
		boneName: t.nodeName ?? null,
		bonePath: t.nodePath ?? null,
		sourceSpringBonePathId: J(t.pathId),
		candidateRoots: i ? [...i.entries()].map(([e, t]) => ({
			root: e,
			colliderCount: t.length,
			colliderSourcePathIds: t.map((e) => e.source.pathId).filter((e) => typeof e == "number")
		})) : [],
		defaultRoot: G(a),
		selectedRoot: o,
		selectedColliderCount: c.length,
		selectedColliderSourcePathIds: c.map((e) => e.source.pathId).filter((e) => typeof e == "number"),
		selectionReason: s
	};
}
function oi(e) {
	return {
		...e,
		candidateRoots: e.candidateRoots.map((e) => ({
			...e,
			colliderSourcePathIds: [...e.colliderSourcePathIds]
		})),
		selectedColliderSourcePathIds: [...e.selectedColliderSourcePathIds]
	};
}
function si(e, t, n) {
	let r = ci(t, n);
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
function ci(e, t) {
	return t.nodePath?.startsWith("sit_body/") ? "sit_body/" : t.nodePath?.startsWith("body/") || e.partKind === "Head" || t.nodePath?.startsWith("face/") ? "body/" : null;
}
function li(e) {
	return e ? `${e.source.managerNodeName ?? "manager"} manager cache (${e.source.sphereColliderIndexes?.length ?? 0} sphere, ${e.source.capsuleColliderIndexes?.length ?? 0} capsule, ${e.source.panelColliderIndexes?.length ?? 0} panel)` : "no manager cache available";
}
function ui(e) {
	return e?.active ? {
		active: !0,
		min: e.min ?? 0,
		max: e.max ?? 0
	} : null;
}
function di(e) {
	return e.isAnimated ? e.dynamicRatio : 1;
}
function fi(e, t, n) {
	let r = pi(n.animatedBoneNames);
	return r.size === 0 ? !1 : r.has(t.name) || typeof e.nodeName == "string" && r.has(e.nodeName);
}
function pi(e) {
	return Array.isArray(e) ? new Set(e.filter((e) => typeof e == "string")) : /* @__PURE__ */ new Set();
}
function mi(e, t, n) {
	let r = t > 0 ? 1 / t : e;
	return n === 1 ? r : r * n;
}
function hi(e) {
	let t = Mi(Mi(Mi(e)?.pjskSpringBone)?.runtimeUnitySetup), n = t?.version;
	return n === "0414" || n === 414 ? t : null;
}
function U(e) {
	return {
		x: e.x,
		y: e.y,
		z: e.z,
		length: e.length()
	};
}
function gi(e, t) {
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
function _i(e) {
	return e.automaticUpdates ? e.enabled ? e.isPaused ? "isPaused=true" : e.isSumOfForcesOnBone ? null : "isSumOfForcesOnBone=false" : "enabled=false" : "automaticUpdates=false";
}
function vi(e) {
	return e ? U(e) : null;
}
function yi(e) {
	return {
		x: e.x,
		y: e.y,
		z: e.z,
		w: e.w
	};
}
function W(e) {
	return {
		currTipPos: U(e.currTipPos),
		prevTipPos: U(e.prevTipPos),
		hitNormal: U(e.hitNormal),
		cachedPosition: U(e.cachedPosition),
		cachedMovement: U(e.cachedMovement)
	};
}
function bi(e) {
	return {
		enabled: e.enableAngleLimits,
		hasPivot: !!e.pivotNode,
		pivotName: e.pivotNode?.name || null,
		pivotPath: e.pivotNode && Y(e.pivotNode) || null,
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
function xi(e, t) {
	return {
		kind: e.kind,
		name: e.debugName ?? null,
		path: e.debugPath ?? null,
		sourcePathId: e.debugSourcePathId ?? null,
		enabled: e.enabled !== !1,
		status: t.status,
		beforeTailPosition: U(t.beforeTailPosition),
		afterTailPosition: U(t.afterTailPosition),
		hitNormal: U(t.hitNormal),
		localHeadPosition: vi(t.details.localHeadPosition),
		localTailPositionBefore: vi(t.details.localTailPositionBefore),
		localTailPositionAfter: vi(t.details.localTailPositionAfter),
		localTailRadius: t.details.localTailRadius ?? null,
		localSphereOrigin: vi(t.details.localSphereOrigin),
		localSphereRadius: t.details.localSphereRadius ?? null,
		localCapsuleStart: vi(t.details.localCapsuleStart),
		localCapsuleEnd: vi(t.details.localCapsuleEnd),
		capsuleRadius: t.details.capsuleRadius ?? null,
		panelWidth: t.details.panelWidth ?? null,
		panelHeight: t.details.panelHeight ?? null
	};
}
function Si(e) {
	return {
		mode: e.mode,
		childCount: e.childCount,
		childNames: [...e.childNames],
		childPaths: [...e.childPaths],
		tailPosition: U(e.tailPosition)
	};
}
function Ci(e) {
	if (!e) return null;
	let t = e.indexOf("/");
	return t < 0 ? e : e.slice(0, t);
}
function G(e) {
	return e ? e.endsWith("/") ? e.slice(0, -1) : e : null;
}
function K(t) {
	return Dn(Array.isArray(t) ? new e.Vector3(t[0] ?? 0, t[1] ?? 0, t[2] ?? 0) : Cn(t, new e.Vector3()));
}
function wi(e, t) {
	e.updateMatrixWorld(!0);
	let n = Ti(jn(e, t.clone()));
	return n ? {
		axis: n,
		source: "computed-local-tip"
	} : {
		axis: br.clone(),
		source: "fallback-local-tip"
	};
}
function Ti(t) {
	let n = Math.fround(t.length());
	return n <= 1e-5 ? null : new e.Vector3(Math.fround(t.x / n), Math.fround(t.y / n), Math.fround(t.z / n));
}
function q(e, t, n) {
	return J(e[t] ?? e[ki(t)]) ?? n;
}
function Ei(t, n) {
	let r = t[n] ?? t[ki(n)];
	return Array.isArray(r) || typeof r == "object" && r ? K(r) : new e.Vector3();
}
function Di(e, t, n) {
	let r = e[t] ?? e[ki(t)];
	return typeof r == "boolean" ? r : typeof r == "number" ? r !== 0 : n;
}
function Oi(e, t) {
	let n = Mi(e[t] ?? e[ki(t)]);
	return J(n?.m_PathID ?? n?.m_pathID ?? n?.pathId);
}
function ki(e) {
	return e.length > 0 ? e[0].toUpperCase() + e.slice(1) : e;
}
function Ai(t, n, r) {
	return r > 0 ? e.MathUtils.euclideanModulo(t + n, r) : t + n;
}
function ji(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function J(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function Mi(e) {
	return e && typeof e == "object" ? e : null;
}
function Y(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(r.name), r = r.parent;
	return n.join("/");
}
function Ni(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(Pi(r.name)), r = r.parent;
	return n.join("/");
}
function Pi(e) {
	return e.replace(/_([1-9]\d*)$/, "");
}
function Fi(e) {
	return e.shape?.sphere ? 0 : e.shape?.capsule ? 1 : 2;
}
function Ii(t) {
	return t.getWorldScale(new e.Vector3()).x;
}
function Li(e) {
	let t = e.elements;
	return Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]);
}
function Ri(e) {
	let t = 0, n = e;
	for (; n;) t += 1, n = n.parent;
	return t;
}
function zi(e, t) {
	for (let n = e; n; n = n.parent) if (n === t) return !0;
	return !1;
}
//#endregion
//#region src/engine/prefabNodeLookup.ts
function Bi(e) {
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
var Vi = 7, Hi = class {
	graph;
	setup;
	constraints;
	constructor(e, t, n) {
		this.graph = e, this.setup = t, e.root.updateMatrixWorld(!0);
		let r = Array.isArray(t.constraints) ? t.constraints : [];
		this.constraints = r.map((t) => Gi(e, t, n));
	}
	update() {
		this.graph.root.updateMatrixWorld(!0);
		let e = this.constraints.map(Ki);
		return this.graph.root.updateMatrixWorld(!0), Wi(this.setup, e);
	}
};
function Ui(e, t, n) {
	if (!t) return null;
	let r = Array.isArray(t.constraints) ? t.constraints : [];
	e.root.updateMatrixWorld(!0);
	let i = r.map((t) => Gi(e, t, n)).map(Ki);
	return e.root.updateMatrixWorld(!0), Wi(t, i);
}
function Wi(e, t) {
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
function Gi(e, t, n) {
	let r = X(t.type) ?? "unknown", i = X(t.ownerPath), a = X(t.ownerName), o = Zi(e, i, a), s = Zi(e, X(t.worldUpObjectPath), X(t.worldUpObjectName)).node, c = (Array.isArray(t.sources) ? t.sources : []).map((t) => Ji(e, t, n, r !== "position"));
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
function Ki(e) {
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
	let d = s.filter(Xi);
	return n === "parent" ? ua(a.node, d, t) ? qi(n, r, i, c, "parent constraint applied with height-scaled translation offsets") : l("skipped", "parent constraint has no positive source weight") : n === "rotation" ? fa(a.node, d, t) ? qi(n, r, i, c, "rotation constraint applied with weighted source rotations") : l("skipped", "rotation constraint has no positive source weight") : n === "position" ? da(a.node, d, t) ? qi(n, r, i, c, "position constraint applied in the parent space") : l("skipped", "position constraint has no positive source weight") : n === "aim" ? pa(a.node, d, t, o) ? qi(n, r, i, c, "aim constraint applied with exported aim/up vectors") : l("skipped", "aim constraint target direction or source weight was invalid") : l("skipped", `unsupported constraint type ${n}`);
}
function qi(e, t, n, r, i) {
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
function Ji(e, t, n, r) {
	let i = X(t.sourcePath), a = X(t.sourceName), o = r ? Yi(e, i, a) : Zi(e, i, null), s = ya(t.weight) ?? 1, c = _a(t.translationOffset, n), l = va(t.rotationOffset);
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
function Yi(e, t, n) {
	if (n) {
		let t = null;
		if (e.root.traverse((e) => {
			!t && e.name === n && (t = e);
		}), t) return {
			node: t,
			reason: "rebound by transform name in the combined model"
		};
	}
	return Zi(e, t, n);
}
function Xi(e) {
	return !!e.node;
}
function Zi(e, t, n) {
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
var Qi = (t) => new e.Vector3(-t.x, t.y, t.z), $i = (t) => new e.Quaternion(t.x, -t.y, -t.z, t.w), ea = Qi, ta = $i;
function na(t) {
	return t.updateMatrixWorld(!0), Qi(t.getWorldPosition(new e.Vector3()));
}
function ra(t) {
	return $i(N(t, new e.Quaternion()));
}
function ia(t) {
	return new e.Quaternion().setFromEuler(new e.Euler(e.MathUtils.degToRad(t.x), e.MathUtils.degToRad(t.y), e.MathUtils.degToRad(t.z), "YXZ"));
}
function aa(t) {
	let n = new e.Euler().setFromQuaternion(t, "YXZ");
	return new e.Vector3(e.MathUtils.radToDeg(n.x), e.MathUtils.radToDeg(n.y), e.MathUtils.radToDeg(n.z));
}
function oa(t, n) {
	let r = t.clone().normalize(), i = new e.Vector3().crossVectors(n, r);
	if (i.lengthSq() < 1e-12) return new e.Quaternion().setFromUnitVectors(new e.Vector3(0, 0, 1), r);
	i = i.normalize();
	let a = new e.Vector3().crossVectors(r, i);
	return new e.Quaternion().setFromRotationMatrix(new e.Matrix4().makeBasis(i, a, r));
}
function sa(t, n) {
	let r = t.reduce((e, t) => e + Math.max(0, t.weight), 0);
	if (r <= 0) return null;
	let i = new e.Vector3();
	for (let e of t) {
		let t = Math.max(0, e.weight);
		if (t <= 0) continue;
		let a = na(e.node);
		n && a.add(n(e, ra(e.node))), i.addScaledVector(a, t / r);
	}
	return i;
}
function ca(e, t) {
	let n = null, r = 0;
	for (let i of e) {
		let e = Math.max(0, i.weight);
		e <= 0 || (n = ga(n, t(i), r, e), r += e);
	}
	return n;
}
function la(t, n, r, i, a = null) {
	let o = e.MathUtils.clamp(ya(n.weight) ?? 1, 0, 1), s = ra(t.parent);
	if (i) {
		let r = s.clone().invert().multiply(i).normalize(), a = ya(n.rotationAxis) ?? Vi, c = n.rotationAtRest ? ha(n.rotationAtRest) : aa($i(t.quaternion)), l = aa(r), u = ia(new e.Vector3(ma(a, 1) ? l.x : c.x, ma(a, 2) ? l.y : c.y, ma(a, 4) ? l.z : c.z)), d = ia(c).slerp(u, o).normalize();
		t.quaternion.copy(ta(d));
	}
	if (r && t.parent) {
		t.parent.updateMatrixWorld(!0);
		let i = Qi(t.parent.worldToLocal(ea(r)));
		a && i.add(a);
		let s = ya(n.translationAxis) ?? Vi, c = n.translationAtRest ? ha(n.translationAtRest) : Qi(t.position), l = new e.Vector3(ma(s, 1) ? i.x : c.x, ma(s, 2) ? i.y : c.y, ma(s, 4) ? i.z : c.z);
		t.position.copy(ea(c.clone().lerp(l, o)));
	}
	t.updateMatrix(), t.updateMatrixWorld(!0);
}
function ua(t, n, r) {
	let i = sa(n, (t, n) => t.translationOffset ? Qi(t.translationOffset).applyQuaternion(n) : new e.Vector3()), a = ca(n, (t) => ra(t.node).multiply(t.rotationOffset ? ia(t.rotationOffset) : new e.Quaternion()));
	return !i || !a ? !1 : (la(t, r, i, a), !0);
}
function da(t, n, r) {
	let i = sa(n);
	return i ? (la(t, r, i, null, r.translationOffset ? ha(r.translationOffset) : new e.Vector3()), !0) : !1;
}
function fa(e, t, n) {
	let r = ca(t, (e) => ra(e.node));
	if (!r) return !1;
	let i = va(n.rotationOffset);
	return i && r.multiply(ia(i)), la(e, n, null, r), !0;
}
function pa(t, n, r, i) {
	let a = sa(n);
	if (!a) return !1;
	let o = na(t), s = a.clone().sub(o);
	if (s.lengthSq() < 1e-12) return !1;
	let c = ha(r.aimVector ?? {
		x: 0,
		y: 0,
		z: 1
	}), l = ha(r.upVector ?? {
		x: 0,
		y: 1,
		z: 0
	}), u = ha(r.worldUpVector ?? {
		x: 0,
		y: 1,
		z: 0
	}), d;
	switch (ya(r.worldUpType) ?? 0) {
		case 1:
			d = i ? na(i).sub(o) : new e.Vector3(0, 1, 0);
			break;
		case 2:
			d = i ? u.clone().applyQuaternion(ra(i)) : u.clone();
			break;
		case 3:
			d = u.clone();
			break;
		case 4:
			d = null;
			break;
		default: d = new e.Vector3(0, 1, 0);
	}
	let f = d ? oa(s, d).multiply(oa(c, l).invert()) : new e.Quaternion().setFromUnitVectors(c.clone().normalize(), s.clone().normalize()), p = va(r.rotationOffset);
	return p && f.multiply(ia(p)), la(t, r, null, f.normalize()), !0;
}
function ma(e, t) {
	return (e & t) !== 0;
}
function ha(t) {
	return Cn(t, new e.Vector3());
}
function ga(e, t, n, r) {
	if (!e) return t.clone();
	let i = t.clone();
	return e.dot(i) < 0 && i.set(-i.x, -i.y, -i.z, -i.w), e.slerp(i, r / (n + r)).normalize();
}
function _a(t, n) {
	return !t || typeof t != "object" ? null : En(Cn(t, new e.Vector3())).multiplyScalar(n);
}
function va(t) {
	return !t || typeof t != "object" ? null : Cn(t, new e.Vector3());
}
function X(e) {
	return typeof e == "string" ? e : null;
}
function ya(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
//#endregion
//#region src/engine/unityPrefabRuntime.ts
function ba(e, t) {
	let n = t, r = e.nodeByPath.get("body/Position");
	if (!r) throw Error("Official CharacterModel PositionNote 'body/Position' was not found.");
	return r.scale.setScalar(n), r.updateMatrix(), e.root.updateMatrixWorld(!0), r;
}
function xa(e) {
	return e && typeof e == "object" ? e : {};
}
function Z(e) {
	let t = xa(xa(xa(e).pjskSpringBone).runtimeUnitySetup);
	return t.version === "0414" ? t : null;
}
function Sa(e) {
	let t = xa(xa(e).nativeMeshes);
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
function Ca(e) {
	return e?.parentingMode === "model_combine_setup";
}
function wa(e, t) {
	e.parent && e.parent.remove(e), t.add(e), e.updateMatrix();
}
function Ta(e, t) {
	for (; e.children.length > 0;) wa(e.children[0], t);
}
function Ea(e, t, n) {
	let r = [], i = /* @__PURE__ */ new Set();
	for (let a of t) {
		let t = e.get(a);
		t && !i.has(t) && (wa(t, n), i.add(t), r.push(a));
	}
	return r;
}
function Da(e, t, n) {
	e.parent && e.parent.remove(e);
	let r = /* @__PURE__ */ new Set();
	e.traverse((e) => {
		e.userData.pjskModelCombineDestroyed = !0, r.add(e);
	});
	for (let [e, n] of t.entries()) r.has(n) && t.delete(e);
	for (let [e, t] of n.entries()) r.has(t) && n.delete(e);
}
function Oa(e, t, n) {
	for (let [r, i] of e.entries()) i === t && e.set(r, n);
}
function ka(e, t, n, r, i) {
	let a = r.childMoveSuffix ?? "_target", o = r.parentRootPath, s = r.childRootPath, c = Q(t, [r.parentCombineNodeAPath ?? r.parentAttachPath]), l = Q(t, [r.parentCombineNodeBPath]), u = Q(t, [r.childCombineNodeAPath ?? r.childOriginPath]), d = Q(t, [r.childCombineNodeBPath]), f = Q(t, [s]);
	if (!o || !s || !c || !l || !u || !d || !f) throw Error("Official model_combine_setup paths were not fully resolved.");
	Ta(l.node, d.node);
	let p = c.node.parent, m = u.node.parent;
	if (p && m) {
		for (let e of [...p.children]) e.name.endsWith(a) && wa(e, m);
		let e = Ea(t, i, t.get(o) ?? p), n = i.filter((t) => !e.includes(t));
		if (n.length > 0) throw Error(`Official model_combine_setup head renderers were not moved: ${n.join(", ")}.`);
		let c = `${s}/${r.faceRendererName ?? "Face"}`;
		if (!e.includes(c)) throw Error(`Official model_combine_setup face renderer '${c}' was not moved.`);
		wa(u.node, p);
	}
	return u.node.position.copy(c.node.position), u.node.quaternion.copy(c.node.quaternion), u.node.scale.copy(c.node.scale), u.node.updateMatrix(), d.node.position.copy(l.node.position), d.node.quaternion.copy(l.node.quaternion), d.node.scale.copy(l.node.scale), d.node.updateMatrix(), Oa(n, c.node, u.node), Oa(n, l.node, d.node), Da(l.node, t, n), Da(c.node, t, n), Da(f.node, t, n), t.set(c.path, u.node), t.set(l.path, d.node), r.parentAttachPath && t.set(r.parentAttachPath, u.node), r.parentCombineNodeBPath && t.set(r.parentCombineNodeBPath, d.node), e.updateMatrixWorld(!0), {
		bodyNodeA: c,
		bodyNodeB: l,
		faceNodeA: u,
		faceNodeB: d
	};
}
function Aa(e, t) {
	return [...new Set((Z(e)?.prefabGraphs ?? []).flatMap((e) => e.renderers ?? []).filter((e) => e.typeName === "SkinnedMeshRenderer").map((e) => e.transformPath).filter((e) => !!(e && e.startsWith(`${t}/`))))];
}
function ja(e, t) {
	let n = Z(e), r = n?.bodyHeadAssembly?.childRootPath, i = t.rendererTransformPath;
	if (!r || !i?.startsWith(`${r}/`)) return !1;
	let a = (n.prefabGraphs ?? []).flatMap((e) => e.renderers ?? []).filter((e) => e.transformPath === i);
	return a.length > 0 && a.every((e) => e.typeName !== "SkinnedMeshRenderer");
}
function Ma(e, t) {
	return (Sa(e)?.meshes ?? []).find((e) => e.rendererTransformPath?.startsWith(`${t}/`) && typeof e.rootBonePath == "string")?.rootBonePath ?? null;
}
function Na(e, t) {
	let n = e, r = /* @__PURE__ */ new Set();
	for (; typeof n.parentPathId == "number";) {
		if (typeof n.pathId == "number" && !r.add(n.pathId)) throw Error(`Runtime prefab graph contains a parent cycle at PathID ${n.pathId}.`);
		let e = t.get(n.parentPathId);
		if (!e) break;
		n = e;
	}
	return n;
}
function Pa(e) {
	let t = e.transformPath?.split("/")[0];
	return t ? `${e.runtimePartIndex ?? -1}:${t}` : null;
}
function Fa(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of Sa(e)?.meshes ?? []) {
		if (typeof r.rendererTransformPathId != "number") continue;
		let e = t.get(r.rendererTransformPathId);
		if (!e) continue;
		let i = Na(e, t), a = Pa(e);
		if (!a || typeof i.pathId != "number") continue;
		let o = n.get(a);
		if (o !== void 0 && o !== i.pathId) throw Error(`Runtime native meshes reference multiple Unity prefab instances for '${a}' (${o}, ${i.pathId}).`);
		n.set(a, i.pathId);
	}
	return n;
}
function Ia(t, n) {
	let r = n.prefabGraphs ?? [], i = new e.Group();
	i.name = "UnityPrefabSourceRoot", i.userData.pjskUnityPrefabSourceGraph = !0;
	let a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map();
	for (let e of r) for (let t of e.transforms ?? []) typeof t.pathId != "number" || !t.transformPath || (o.set(t.pathId, t), c.set(t.transformPath, (c.get(t.transformPath) ?? 0) + 1));
	let l = new Set([...c.entries()].filter(([, e]) => e > 1).map(([e]) => e)), u = Fa(t, o);
	for (let t of r) for (let n of t.transforms ?? []) {
		if (typeof n.pathId != "number" || !n.transformPath) continue;
		let t = new e.Object3D();
		t.name = n.name ?? n.transformPath.split("/").pop() ?? `path_${n.pathId}`, t.userData.pjskTransformPath = n.transformPath, t.userData.pjskRuntimePartIndex = n.runtimePartIndex, t.userData.pjskPoseRoot = n.poseRoot ?? null, t.position.copy(En(Cn(n.localPosition, new e.Vector3()))), t.quaternion.copy(On(wn(n.localRotation))), t.scale.copy(Cn(n.localScale, new e.Vector3(1, 1, 1))), t.updateMatrix(), a.set(n.pathId, t);
		let r = Na(n, o), i = u.get(Pa(n) ?? "");
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
function La(e, t) {
	let n = Z(e);
	if (!n?.prefabGraphs?.length) return null;
	let { root: r, nodeByPath: i, nodeByPathId: a, ambiguousPaths: o } = Ia(e, n);
	r.updateMatrixWorld(!0);
	let s = za(r), c = n.bodyHeadAssembly;
	if (!Ca(c)) throw Error("Runtime package must provide the official model_combine_setup body/head assembly.");
	let l = Q(i, [c.parentAttachPath]), u = Q(i, [c.childRootPath]), d = Q(i, [c.childOriginPath]);
	if (!l || !u || !d) throw Error("Official model_combine_setup body/head roots were not fully resolved.");
	let f = Aa(e, u.path), p = ka(r, i, a, c, f), m = Ma(e, l.path.split("/")[0]), h = m ? i.get(m) ?? null : null, g = za(r), _ = s - g, v = [];
	if (t) {
		let e = Bi(t);
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
			modelCombineBodyNeck: eo(p.bodyNodeA.node, r),
			modelCombineFaceNeck: eo(p.faceNodeA.node, r)
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
function Ra(e) {
	let t = Z(e);
	if (!t?.prefabGraphs?.length) return null;
	let { root: n, nodeByPath: r, nodeByPathId: i, ambiguousPaths: a } = Ia(e, t), o = za(n);
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
function za(e) {
	let t = 0;
	return e.traverse((n) => {
		n !== e && (t += 1);
	}), t;
}
function Ba(t, n) {
	let r = Sa(n), i = r?.meshes ?? [];
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
		if (ja(n, r)) continue;
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
		let m = Wa(r);
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
			let n = Ua(r, x.length, c), a = b.matrixWorld.clone();
			if (n.length > 0) {
				let e = a.clone().invert();
				for (let t of n) t.multiply(e);
			}
			let o = new e.Skeleton(x, n.length > 0 ? n : void 0);
			n.length === 0 && o.calculateInverses(), b.bind(o, a);
			let l = Va(x[0], o.boneInverses[0]), u = Ha(x, o.boneInverses), d = i && t.headRendererPaths.includes(i) ? t.bodyRootBone ?? null : typeof r.rootBonePathId == "number" ? t.nodeByPathId.get(r.rootBonePathId) ?? null : r.rootBonePath ? t.nodeByPath.get(r.rootBonePath) ?? null : null;
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
function Va(t, n) {
	let r = new e.Matrix4().multiplyMatrices(t.matrixWorld, n), i = new e.Vector3(), a = new e.Quaternion(), o = new e.Vector3();
	return r.decompose(i, a, o), {
		restTranslation: Qa(i),
		restScale: Qa(o)
	};
}
function Ha(t, n) {
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
function Ua(t, n, r) {
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
function Wa(t) {
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
function Ga(e, t, n, r) {
	e.root.updateMatrixWorld(!0);
	let i = r ? r.update() : Ui(e, Z(t)?.constraintSetup, n);
	for (let t of e.meshCarrierBindings) t.target.position.copy(t.source.position), t.target.quaternion.copy(t.source.quaternion), t.target.scale.copy(t.source.scale), t.target.updateMatrix();
	return e.root.updateMatrixWorld(!0), i;
}
function Ka(e, t, n) {
	let r = Z(t)?.constraintSetup;
	return r ? new Hi(e, r, n) : null;
}
function qa(e, t, n) {
	let r = {
		...e?.debug ?? n,
		setupVersion: Ja(t)
	};
	if (!e) return r;
	let i = e.root;
	i.updateMatrixWorld(!0);
	let a = Z(t)?.bodyHeadAssembly, o = Bi(i), s = (t) => {
		let n = Q(e.nodeByPath, t) ?? Ya(o, t);
		return n ? eo(n.node, i) : null;
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
		positionRoots: to(i),
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
function Ja(e) {
	return Z(e) ? "0414" : "";
}
function Ya(e, t) {
	for (let n of t) {
		let t = e.get(n);
		if (t) return {
			node: t,
			path: n
		};
	}
	return null;
}
function Xa(e) {
	return e.replace(/_\d+$/, "");
}
function Za(e, t, n = !1) {
	let r = [], i = e;
	for (; i && i !== t;) i.name && r.push(n ? Xa(i.name) : i.name), i = i.parent;
	return r.reverse().join("/");
}
function Qa(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5))
	};
}
function $a(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5)),
		w: Number(e.w.toFixed(5))
	};
}
function eo(t, n) {
	t.updateMatrixWorld(!0);
	let r = new e.Vector3(), i = new e.Quaternion(), a = new e.Vector3(0, 0, 1);
	return t.getWorldPosition(r), N(t, i), a.applyQuaternion(i).normalize(), {
		path: Za(t, n),
		canonicalPath: Za(t, n, !0),
		parentPath: t.parent && t.parent !== n ? Za(t.parent, n) : null,
		destroyed: t.userData.pjskModelCombineDestroyed === !0,
		localPosition: Qa(t.position),
		localQuaternion: $a(t.quaternion),
		worldPosition: Qa(r),
		worldQuaternion: $a(i),
		worldForward: Qa(a)
	};
}
function to(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	return e.updateMatrixWorld(!0), e.traverse((r) => {
		if (r === e || !r.name || n.has(r)) return;
		let i = Za(r, e, !0), a = i === "face/Position", o = i === "body/Position", s = i.endsWith("/Position") && i.split("/").some((e) => e.startsWith("mdl_chr_"));
		!a && !o && !s || (n.add(r), t.push(eo(r, e)));
	}), t;
}
//#endregion
export { St as A, pn as C, It as D, Zt as E, r as F, i as I, n as L, ne as M, h as N, Rt as O, s as P, yn as S, Qt as T, On as _, Ba as a, bn as b, Bi as c, Ln as d, Gn as f, sr as g, cr as h, Ka as i, Je as j, Ct as k, wr as l, $n as m, Ra as n, qa as o, tr as p, La as r, Ga as s, ba as t, Rr as u, N as v, Gt as w, vn as x, Tn as y };
