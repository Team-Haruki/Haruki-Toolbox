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
		e.motionType ?? "costume"
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
	return `${e}:${de(t)}`;
}
function g(e, t, n, r = {}) {
	return e.registry.filter((e) => e.characterId === t).filter((e) => r.unit === void 0 || fe(e.unit, r.unit)).filter((e) => f(e) === n).filter(ae).sort((e, t) => e.costume3dId - t.costume3dId);
}
function _(e) {
	let { partSet: t, selection: n, activeRoleId: r } = e, i = h(n.characterId, n.unit);
	if (r !== null && i !== r) throw Error(`Custom switching is limited to role ${r}. Reload/select another role before switching to ${i}.`);
	let a = v(t, n.characterId, n.unit, "body", n.bodyCostume3dId), o = x(t, n), s = y(t, b(t, n), "hair"), c = {
		...n,
		headPackagePath: o.packagePath
	}, l = ee(t, c, o), u = l && d(l.part) === "head" ? l : s, f = l && d(l.part) === "head_optional" ? l : null, p = te(t, n);
	se(n.characterId, n.unit, [
		a,
		u,
		f,
		p
	].filter(Boolean)), ce(t.compatibility, c, d(o));
	let m = [
		a,
		u,
		f,
		p
	].filter(Boolean), g = pe(o), _ = me(m, g), S = t.role && h(t.role.characterId, t.role.unit) === i ? t.role : null;
	if (!S) throw Error(`The part set has no role ${i}.`);
	let ne = [a, ...me([
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
		characterHeightMeters: S.characterHeightMeters,
		skinColors: S.skinColors,
		materialSlots: ne,
		runtimeExtension: ge(_)
	};
}
function v(e, t, n, r, i) {
	let a = ie(e, t, n, r, i);
	if (!a) throw Error(`Missing ${r} registry entry for role ${h(t, n)}, costume3dId ${i}.`);
	return y(e, a, r);
}
function y(e, t, n) {
	if (!e.packages.has(t.packagePath)) throw Error(`Missing loaded ${n} package for role ${h(t.characterId, t.unit)}, ${ne(t)}.`);
	return re(e.packages.get(t.packagePath), t);
}
function b(e, t) {
	let n = ie(e, t.characterId, t.unit, "hair", t.hairCostume3dId);
	if (!n) throw Error(`Missing hair registry entry for role ${h(t.characterId, t.unit)}, costume3dId ${t.hairCostume3dId}.`);
	let r = x(e, t).headCostume3dAssetbundleType?.trim().toLowerCase(), i = r ? n.headTypeVariants?.[r] : void 0;
	return i ? {
		...n,
		bundlePath: i.bundlePath,
		packagePath: i.packagePath
	} : n;
}
function x(e, t) {
	let n = t.headPackagePath?.trim() || null, r = e.registry.filter((e) => e.characterId === t.characterId && fe(e.unit, t.unit) && e.costume3dId === t.headCostume3dId && ["head", "head_optional"].includes(f(e) ?? "") && ae(e) && (n === null || e.packagePath === n)).sort((e, t) => {
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
	if (oe(n)) return null;
	if (!e.packages.has(n.packagePath)) throw Error(`Missing loaded head package for role ${h(t.characterId, t.unit)}, ${ne(n)}.`);
	return re(e.packages.get(n.packagePath), n);
}
function te(e, t) {
	let n = S(e, t);
	if (!n || oe(n)) return null;
	if (!e.packages.has(n.packagePath)) throw Error(`Missing loaded head_optional package for role ${h(t.characterId, t.unit)}, ${ne(n)}.`);
	return re(e.packages.get(n.packagePath), n);
}
function S(e, t) {
	if (!t.headOptionalCostume3dId) return null;
	let n = e.registry.filter((e) => e.characterId === t.characterId && fe(e.unit, t.unit) && e.costume3dId === t.headOptionalCostume3dId && f(e) === "head_optional" && ae(e)).sort((e, t) => e.packagePath.localeCompare(t.packagePath));
	if (n.length === 0) throw Error(`Missing head_optional registry entry for role ${h(t.characterId, t.unit)}, costume3dId ${t.headOptionalCostume3dId}.`);
	let r = new Set(n.map((e) => e.packagePath));
	if (r.size > 1) throw Error(`Ambiguous head_optional registry entry for role ${h(t.characterId, t.unit)}, costume3dId ${t.headOptionalCostume3dId}; the legacy selector cannot identify one original source. Candidates: ${[...r].join(", ")}.`);
	return n[0];
}
function ne(e) {
	let t = [
		`costume3dId ${e.costume3dId}`,
		`partType ${d(e)}`,
		`packagePath ${e.packagePath}`
	];
	e.bundlePath && t.push(`bundlePath ${e.bundlePath}`), e.colorVariationBundlePath && t.push(`colorVariationBundlePath ${e.colorVariationBundlePath}`);
	let n = e.warnings?.[0];
	return n && t.push(`warning ${n}`), t.join(", ");
}
function re(e, t) {
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
function ie(e, t, n, r, i) {
	return e.registry.find((e) => e.characterId === t && fe(e.unit, n) && e.costume3dId === i && f(e) === r && ae(e));
}
function ae(e) {
	return e.status !== "missing";
}
function oe(e) {
	return e.status === "empty" && f(e) === "head_optional";
}
function se(e, t, n) {
	let r = n.find((n) => n.part.characterId !== e || !fe(n.part.unit, t));
	if (r) throw Error(`Part ${r.part.partType}/${r.part.costume3dId} belongs to role ${h(r.part.characterId, r.part.unit)}, not ${h(e, t)}.`);
}
function ce(e, t, n) {
	if (!e || n === "head") return;
	let r = ue(t.unit, t.headCostume3dId, t.hairCostume3dId);
	if (le(e).has(r)) throw Error(`Head ${t.headCostume3dId} and hair ${t.hairCostume3dId} are not available together.`);
}
function le(e) {
	if (!e) return /* @__PURE__ */ new Set();
	let t = l.get(e);
	if (t) return t;
	let n = new Set([...e.denied ?? [], ...(e.rules ?? []).filter((e) => e.state === "not_available")].map((e) => ue(e.unit, e.headCostume3dId, e.hairCostume3dId)));
	return l.set(e, n), n;
}
function ue(e, t, n) {
	return `${de(e)}|${t}|${n}`;
}
function de(e) {
	return e ?? "";
}
function fe(e, t) {
	return de(e) === de(t);
}
function pe(e) {
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
function me(e, t) {
	return e.filter((e) => he(e, t));
}
function he(e, t) {
	return t.activePartTypes.has(d(e.part));
}
function C(e) {
	return typeof e == "string" ? e : "";
}
function ge(e) {
	let t = ve(e);
	return {
		characterControllers: _e(e),
		nativeMeshes: ct(e, t),
		pjskSpringBone: {
			raw: t.raw,
			runtimeUnitySetup: t
		}
	};
}
function _e(e) {
	let t = e.findIndex((e) => {
		let t = d(e.part);
		return t === "head" || t === "hair";
	}), n = t >= 0 ? e[t].characterControllers ?? {} : {}, r = (e) => {
		if (Array.isArray(e)) return e.map(r);
		if (!D(e) || ArrayBuffer.isView(e)) return e;
		let n = {};
		for (let [i, a] of Object.entries(e)) n[i] = (i === "pathId" || i === "transformPathId") && typeof a == "number" ? T(a, t) : i === "raw" ? a : r(a);
		return n;
	};
	return r(n);
}
function ve(e) {
	let t = e.map((e, t) => Ne(e, t)), n = t[0]?.setup ?? {}, r = t.map((e) => e.prefabGraph).filter((e) => e !== null), i = e.flatMap((e) => [...e.warnings ?? [], ...e.springBone?.warnings ?? []]), a = bt(t.flatMap((e) => e.activeRoots)), o = t.flatMap((e) => e.managers), s = t.flatMap((e) => e.bones), c = t.flatMap((e) => e.extraBones), l = t.flatMap((e) => e.colliders), u = t.flatMap((e) => e.constraints), d = Ye(t), f = ye(i, d), p = et(t, d), m = $e(s, d), h = Oe(r);
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
		funit: Ee(e),
		raw: De(t),
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
			warnings: bt(t.flatMap((e) => vt(e.setup.constraintSetup?.warnings)))
		},
		managerColliderCaches: p,
		warnings: f
	};
	return be(t, g, ut(e)), g;
}
function ye(e, t) {
	let n = t.filter((e) => e.sourceKind === "colliderFlag");
	return n.length > 0 && n.every((e) => yt(e.colliders).length > 0) ? e.filter((e) => !/has colliderFlag .* but no body colliders matched runtime CL_\* prefixes/.test(e)) : e;
}
function be(e, t, n) {
	for (let r of e.filter((e) => e.partType === "head_optional")) {
		let i = r.prefabGraph, a = gt(C(r.runtime.mount?.attachNode)), o = a ? xe(e, a) : null, s = (i?.transforms ?? []).find((e) => e.parentPathId == null && C(e.transformPath) === "optional");
		if (!i || !o || !s || typeof o.pathId != "number" || typeof s.pathId != "number") {
			t.warnings?.push(`Head optional prefab '${C(r.runtime.part.modelAssetbundleName) || "<unknown>"}' was not instantiated: official prefab root 'optional' or active attach node '${a || "<missing>"}' was not found.`);
			continue;
		}
		let c = (i.monoBehaviours ?? []).find((e) => C(e.scriptName) === "CharacterAccessoryTransformController" && Ce(C(e.transformPath), "optional"));
		if (c) {
			let e = C(c.transformPath), a = (i.transforms ?? []).find((t) => C(t.transformPath) === e);
			a ? (we(a, ft(r.runtime, n)), i.headOptionalControllerPath = e) : t.warnings?.push(`Head optional controller target '${e || "<missing>"}' was not found in prefab 'optional'.`);
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
		Se(i, "optional"), s.parentPathId = o.pathId, o.childPathIds = [.../* @__PURE__ */ new Set([...o.childPathIds ?? [], s.pathId])], i.headOptionalAttachPath = C(o.transformPath), i.headOptionalPrefabRootPath = "optional";
	}
}
function xe(e, t) {
	for (let n of e) {
		if (n.partType === "head_optional" || !n.prefabGraph) continue;
		let e = n.prefabGraph.transforms ?? [], r = new Map(e.filter((e) => typeof e.pathId == "number").map((e) => [e.pathId, e])), i = new Map(O(n.prefabGraph.gameObjects).map((e) => [ht(e.pathId, NaN), e.activeSelf !== !1 && e.activeInHierarchy !== !1])), a = (e) => typeof e.gameObjectPathId != "number" || i.get(e.gameObjectPathId) !== !1, o = (e) => {
			if (!a(e)) return null;
			if (C(e.name) === t || gt(C(e.transformPath)) === t) return e;
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
function Se(e, t) {
	let n = (e) => Ce(C(e.transformPath), t);
	e.transforms = (e.transforms ?? []).filter(n), e.gameObjects = O(e.gameObjects).filter(n), e.renderers = O(e.renderers).filter(n), e.animators = O(e.animators).filter(n), e.monoBehaviours = (e.monoBehaviours ?? []).filter(n), e.constraints = O(e.constraints).filter(n), e.rootTransformPathIds = e.transforms.filter((e) => C(e.transformPath) === t).map((e) => e.pathId).filter((e) => typeof e == "number");
}
function Ce(e, t) {
	return e === t || e.startsWith(`${t}/`);
}
function we(e, t) {
	let n = mt(t?.position, 0, 0, 0), r = mt(t?.rotationEulerDegrees, 0, 0, 0), i = mt(t?.scale, 1, 1, 1);
	e.localPosition = {
		X: n.x,
		Y: n.y,
		Z: n.z
	}, e.localRotation = Te(r), e.localScale = {
		X: Math.abs(i.x),
		Y: Math.abs(i.y),
		Z: Math.abs(i.z)
	};
}
function Te(e) {
	let t = e.x * Math.PI / 180, n = e.y * Math.PI / 180, r = e.z * Math.PI / 180, i = Math.cos(t / 2), a = Math.cos(n / 2), o = Math.cos(r / 2), s = Math.sin(t / 2), c = Math.sin(n / 2), l = Math.sin(r / 2);
	return {
		x: s * a * o - i * c * l,
		y: i * c * o + s * a * l,
		z: i * a * l + s * c * o,
		w: i * a * o - s * c * l
	};
}
function Ee(e) {
	let t = e.map((e) => _t(e.springBone?.funit)).filter((e) => Object.keys(e).length > 0), n = (e, t) => typeof e[t] == "number" && Number.isFinite(e[t]) ? Math.max(Math.trunc(e[t]), 0) : 0, r = bt(t.flatMap((e) => vt(e.detectedScripts))).sort((e, t) => e.localeCompare(t));
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
function De(e) {
	let t = e.filter((e) => e.partType === "body").flatMap((e) => e.extraBones), n = e.filter((e) => e.partType === "head" || e.partType === "hair" || e.partType === "head_optional").flatMap((e) => e.extraBones);
	return {
		body: { extraBones: t },
		head: { extraBones: n }
	};
}
function Oe(e) {
	let t = ke(e), n = Ae(e);
	return !t || !je(e, "face") || !n ? null : {
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
function ke(e) {
	return ["body/Position/PositionOffset/Hip/Waist/Spine/Chest/Neck", "body/Position/Hip/Waist/Spine/Chest/Neck"].find((t) => je(e, t)) ?? null;
}
function Ae(e) {
	return ["face/Position/Hip/Waist/Spine/Chest/Neck", "face/Position"].find((t) => je(e, t)) ?? null;
}
function je(e, t) {
	return e.some((e) => O(e?.transforms).some((e) => C(e.transformPath) === t));
}
function Me(e) {
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
function Ne(e, t) {
	let n = Me(e), r = d(e.part), i = Pe(r, vt(n.activeRootProfile?.activeRoots)), a = Fe(w(n.managers, t, r), i), o = Fe(w(n.bones, t, r), i), s = Fe(Ie(n.extraBones, t, r), i), c = Fe(w(n.colliders, t, r), i), l = Re(w(n.colliderBindings, t, r), o), u = ze(w(n.managerColliderCaches, t, r), a), f = Be(n.constraintSetup, t, r, i);
	return He(a, o, u), {
		runtime: e,
		partIndex: t,
		partType: r,
		setup: n,
		prefabGraph: Ve(e.springBone?.prefabGraph, t),
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
function Pe(e, t) {
	return e === "body" && t.includes("body") ? ["body"] : (e === "head" || e === "hair") && t.includes("face") ? ["face"] : e === "head_optional" && t.includes("optional") ? ["optional"] : t.length ? [t[0]] : [e === "body" ? "body" : "face"];
}
function Fe(e, t) {
	let n = new Set(t.map((e) => E(e)));
	return e.filter((e) => {
		let t = E(st(e.nodePath) ?? e.poseRoot);
		return n.has(t);
	});
}
function Ie(e, t, n) {
	return w(e, t, n).map((e) => {
		let n = e, r = Le(n.gameObject ?? n.GameObject, t), i = Le(n.referenceBone ?? n.ReferenceBone, t);
		return n.gameObject = r, n.GameObject = r, n.referenceBone = i, n.ReferenceBone = i, n.nodePath = r?.transformPath ?? r?.TransformPath ?? null, n.poseRoot = st(n.nodePath) ?? null, n;
	});
}
function Le(e, t) {
	if (!D(e)) return e;
	let n = { ...e };
	return typeof n.pathId == "number" && (n.pathId = T(n.pathId, t)), typeof n.PathId == "number" && (n.PathId = T(n.PathId, t)), n;
}
function Re(e, t) {
	let n = new Set(t.map((e) => e.pathId).filter((e) => typeof e == "number"));
	return e.filter((e) => typeof e.sourceSpringBonePathId != "number" || n.has(e.sourceSpringBonePathId));
}
function ze(e, t) {
	let n = new Set(t.map((e) => e.pathId).filter((e) => typeof e == "number"));
	return e.filter((e) => typeof e.managerPathId != "number" || n.has(e.managerPathId));
}
function Be(e, t, n, r) {
	let i = new Set(r.map((e) => E(e)));
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
		let t = E(st(e.ownerPath));
		return !t || i.has(t);
	});
}
function Ve(e, t) {
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
function He(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = n.nodePath, i = t.filter((t) => Ue(t.nodePath, e)).map((e) => e.pathId).filter((e) => typeof e == "number");
		i.length && (n.bonePathIds = i, typeof n.pathId == "number" && r.set(n.pathId, i));
	}
	for (let e of n) {
		let t = typeof e.managerPathId == "number" ? r.get(e.managerPathId) : void 0;
		t?.length && (e.springBonePathIds = t);
	}
}
function Ue(e, t) {
	return !e || !t ? !1 : e === t || e.startsWith(`${t}/`);
}
function w(e, t, n) {
	return Array.isArray(e) ? e.map((e) => {
		if (!D(e)) return e;
		let r = { ...e };
		return r.runtimePartIndex = t, r.runtimePartType = n, typeof r.pathId == "number" && (r.pathId = T(r.pathId, t)), typeof r.index == "number" && (r.index = T(r.index, t)), typeof r.managerPathId == "number" && (r.managerPathId = T(r.managerPathId, t)), typeof r.pivotSourcePathId == "number" && (r.pivotSourcePathId = T(r.pivotSourcePathId, t)), typeof r.sourceSpringBonePathId == "number" && (r.sourceSpringBonePathId = T(r.sourceSpringBonePathId, t)), Array.isArray(r.bonePathIds) && (r.bonePathIds = r.bonePathIds.map((e) => typeof e == "number" ? T(e, t) : e)), Array.isArray(r.forceProviders) && (r.forceProviders = We(r.forceProviders, t)), Array.isArray(r.directColliderPathIds) && (r.directColliderPathIds = r.directColliderPathIds.map((e) => typeof e == "number" ? T(e, t) : e)), Array.isArray(r.sourceColliderPathIds) && (r.sourceColliderPathIds = r.sourceColliderPathIds.map((e) => typeof e == "number" ? T(e, t) : e)), Array.isArray(r.colliders) && (r.colliders = r.colliders.map((e) => typeof e == "number" ? T(e, t) : e)), Array.isArray(r.selectedColliderIndexes) && (r.selectedColliderIndexes = r.selectedColliderIndexes.map((e) => typeof e == "number" ? T(e, t) : e)), Array.isArray(r.sphereColliderIndexes) && (r.sphereColliderIndexes = r.sphereColliderIndexes.map((e) => typeof e == "number" ? T(e, t) : e)), Array.isArray(r.capsuleColliderIndexes) && (r.capsuleColliderIndexes = r.capsuleColliderIndexes.map((e) => typeof e == "number" ? T(e, t) : e)), Array.isArray(r.panelColliderIndexes) && (r.panelColliderIndexes = r.panelColliderIndexes.map((e) => typeof e == "number" ? T(e, t) : e)), Array.isArray(r.springBonePathIds) && (r.springBonePathIds = r.springBonePathIds.map((e) => typeof e == "number" ? T(e, t) : e)), D(r.collidersByRoot) && (r.collidersByRoot = Ge(r.collidersByRoot, t)), D(r.candidateRoots) && (r.candidateRoots = Ge(r.candidateRoots, t)), r;
	}) : [];
}
function We(e, t) {
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
function Ge(e, t) {
	return Object.fromEntries(Object.entries(e).map(([e, n]) => [e, Array.isArray(n) ? n.map((e) => typeof e == "number" ? T(e, t) : e).filter((e) => typeof e == "number") : []]));
}
var Ke = [
	[1, "CL_Hip"],
	[2, "CL_Chest"],
	[4, "CL_Left_Arm"],
	[8, "CL_Right_Arm"],
	[16, "CL_Left_Elbow"],
	[32, "CL_Right_Elbow"]
];
function qe(e) {
	return Ke.filter(([t]) => (e & t) !== 0).map(([, e]) => e);
}
function Je(e) {
	return e.flatMap((e) => e.partType === "body" ? [] : e.bones.filter((t) => (t.colliderFlag ?? 0) === 0 || typeof t.pathId != "number" ? !1 : !e.colliderBindings.some((e) => e.sourceSpringBonePathId === t.pathId && (e.sourceKind === "deferred_body_colliderFlag" || e.sourceKind === "colliderFlag"))).map((t) => ({
		sourceKind: "deferred_body_colliderFlag",
		partKind: t.partKind ?? e.partType,
		sourceSpringBonePathId: t.pathId,
		colliderFlag: t.colliderFlag,
		matchedPrefixes: qe(t.colliderFlag ?? 0),
		collidersByRoot: {},
		defaultRoot: "body",
		sourceColliderPathIds: [],
		colliders: [],
		rebindReason: "viewer_synthesized_missing_colliderFlag_binding"
	})));
}
function Ye(e) {
	let t = e.filter((e) => e.partType === "body").flatMap((e) => e.colliders), n = rt(t);
	return Je(e).map((e) => Xe(e, t)).concat(e.flatMap((e) => e.colliderBindings.map((r) => {
		if (r.sourceKind === "deferred_body_colliderFlag" && e.partType !== "body") return Xe(r, t);
		if (r.sourceKind !== "colliderFlag" || e.partType === "body" || !it(n)) return r;
		let i = at(n);
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
function Xe(e, t) {
	let n = Ze(e, t);
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
function Ze(e, t) {
	let n = vt(e.matchedPrefixes), r = rt(t.filter((e) => typeof e.index == "number" && Qe(e, n))), i = it(r) ? at(r).root : E(e.defaultRoot ?? "body");
	return {
		byRoot: r,
		defaultRoot: i,
		indexes: r[i] ?? []
	};
}
function Qe(e, t) {
	if (!t.length) return !1;
	let n = C(e.nodeName);
	return t.some((e) => n.startsWith(e));
}
function $e(e, t) {
	let n = new Map(e.filter((e) => typeof e.pathId == "number").map((e) => [e.pathId, e]));
	return t.filter((e) => typeof e.sourceSpringBonePathId == "number").map((e) => {
		let t = n.get(e.sourceSpringBonePathId), r = it(e.collidersByRoot) ? e.collidersByRoot : { [e.defaultRoot ?? t?.poseRoot ?? "unknown"]: e.colliders ?? [] };
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
function et(e, t) {
	let n = new Map(e.flatMap((e) => e.colliders).filter((e) => typeof e.index == "number").map((e) => [e.index, e]));
	return e.flatMap((e) => e.managerColliderCaches.map((r) => e.partType === "head" || e.partType === "hair" ? tt(r, t, n) : nt(r, n)));
}
function tt(e, t, n) {
	let r = new Set(yt(e.springBonePathIds)), i = xt(t.filter((e) => typeof e.sourceSpringBonePathId == "number" && r.has(e.sourceSpringBonePathId) && e.sourceKind === "colliderFlag").flatMap((e) => yt(e.colliders)).filter((e) => n.has(e)));
	return i.length ? {
		...e,
		sphereColliderIndexes: i.filter((e) => C(n.get(e)?.scriptName).includes("Sphere")),
		capsuleColliderIndexes: i.filter((e) => C(n.get(e)?.scriptName).includes("Capsule")),
		panelColliderIndexes: i.filter((e) => C(n.get(e)?.scriptName).includes("Panel")),
		reason: "viewer_composed_head_body_collider_cache"
	} : nt(e, n);
}
function nt(e, t) {
	return {
		...e,
		sphereColliderIndexes: yt(e.sphereColliderIndexes).filter((e) => t.has(e)),
		capsuleColliderIndexes: yt(e.capsuleColliderIndexes).filter((e) => t.has(e)),
		panelColliderIndexes: yt(e.panelColliderIndexes).filter((e) => t.has(e)),
		reason: "viewer_composed_active_parts_manager_cache"
	};
}
function rt(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		if (typeof n.index != "number") continue;
		let e = E(st(n.nodePath) ?? n.poseRoot ?? "body"), r = t.get(e) ?? [];
		r.push(n.index), t.set(e, r);
	}
	return Object.fromEntries([...t.entries()].map(([e, t]) => [e, [...new Set(t)].sort((e, t) => e - t)]));
}
function it(e) {
	return !!(e && Object.values(e).some((e) => e.length > 0));
}
function at(e) {
	let [t, n] = Object.entries(e).sort(([e], [t]) => ot(e) - ot(t) || e.localeCompare(t))[0];
	return {
		root: t,
		indexes: n
	};
}
function ot(e) {
	return e === "body" ? 0 : e === "sit_body" ? 1 : e === "guitar_body" ? 2 : 10;
}
function E(e) {
	return (e ?? "").trim() || "body";
}
function st(e) {
	return e?.split("/").find(Boolean) ?? null;
}
function ct(e, t) {
	let n = [...t.warnings ?? []], r = [];
	for (let [i, a] of e.entries()) {
		let e = d(a.part);
		for (let o of O(a.nativeMeshes?.meshes)) {
			let a = lt(o, i);
			if (e !== "head_optional") {
				r.push(a);
				continue;
			}
			let s = C(a.rendererTransformPath), c = O(t.prefabGraphs).find((e) => ht(e.runtimePartIndex, -1) === i && !!C(e.headOptionalAttachPath)), l = C(c?.headOptionalPrefabRootPath);
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
function lt(e, t) {
	let n = { ...e };
	for (let e of [
		"rendererPathId",
		"rendererTransformPathId",
		"rootBonePathId"
	]) typeof n[e] == "number" && (n[e] = T(n[e], t));
	return Array.isArray(n.bonePathIds) && (n.bonePathIds = n.bonePathIds.map((e) => typeof e == "number" ? T(e, t) : e)), n;
}
function ut(e) {
	let t = [
		...e.filter((e) => d(e.part) === "head"),
		...e.filter((e) => d(e.part) === "hair"),
		...e.filter((e) => d(e.part) !== "head_optional")
	];
	for (let e of t) {
		let t = dt(C(e.source?.bundlePath));
		if (t) return t;
		let n = dt(C(e.part.modelAssetbundleName));
		if (n) return n;
	}
	return null;
}
function dt(e) {
	let t = e.replace(/\\/g, "/").replace(/\.bundle$/i, "").match(/(?:^|\/)face\/([^/]+)\/([^/]+)$/i);
	return t ? `${t[1]}/${t[2]}` : null;
}
function ft(e, t) {
	if (!t) return null;
	let n = pt(e)[t];
	return D(n) ? n : null;
}
function pt(e) {
	return _t(e.mount?.accessoryTransformAdjustments);
}
function mt(e, t, n, r) {
	let i = _t(e);
	return {
		x: ht(i.x ?? i.X, t),
		y: ht(i.y ?? i.Y, n),
		z: ht(i.z ?? i.Z, r)
	};
}
function ht(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function gt(e) {
	return (e?.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? "") || null;
}
function D(e) {
	return !!(e && typeof e == "object" && !Array.isArray(e));
}
function _t(e) {
	return D(e) ? e : {};
}
function vt(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "string") : [];
}
function O(e) {
	return Array.isArray(e) ? e.filter((e) => D(e)) : [];
}
function yt(e) {
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
	let r = "optional", i = Ve(t.springBone?.prefabGraph, 0), a = i?.transforms?.find((e) => e.parentPathId == null && C(e.transformPath) === r);
	if (!i || !a) throw Error(`Head optional part ${t.packagePath} has no official prefab root '${r}'.`);
	Se(i, r), a.localPosition = {
		X: 0,
		Y: 0,
		Z: 0
	}, a.localRotation = {
		x: 0,
		y: 0,
		z: 0,
		w: 1
	}, i.headOptionalPrefabRootPath = r;
	let o = O(t.nativeMeshes?.meshes).map((e) => lt(e, 0)).filter((e) => Ce(C(e.rendererTransformPath), r));
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
			S(this.partSet, e)
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
//#region src/runtime/runtimePackageLoader.ts
async function Tt(e, t) {
	let n = Ot(t.roleId), r = await e.roleIndex(n.characterId, n.unit);
	if (r.registry.length === 0) throw Error(`The master rows have no parts for role ${t.roleId}.`);
	let i = {
		registry: r.registry,
		role: r.role,
		masterVersion: r.masterVersion,
		compatibility: r.compatibility,
		packages: /* @__PURE__ */ new Map(),
		contentId: e.id
	}, a = new Ct({ loadPartRuntime: (t) => Dt(e, i, t) });
	return a.loadPartPackageSet(i), {
		combinedCharacter: t.deferDefaultSelection ? null : await a.setCustomSelection(Et(r.role)),
		partSet: i,
		wardrobe: a
	};
}
function Et(e) {
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
async function Dt(e, t, n) {
	let r = t.packages.get(n.packagePath);
	if (r) return r;
	let i = await e.build(n);
	return t.packages.set(n.packagePath, i), i;
}
function Ot(e) {
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
var kt = {
	right: new e.Vector3(1, 0, 0),
	left: new e.Vector3(-1, 0, 0),
	up: new e.Vector3(0, 1, 0),
	down: new e.Vector3(0, -1, 0),
	forward: new e.Vector3(0, 0, 1),
	back: new e.Vector3(0, 0, -1)
};
function k(t, n) {
	if (!t) return n.clone();
	let r = M(t.x ?? t.X), i = M(t.y ?? t.Y), a = M(t.z ?? t.Z);
	return r === null || i === null || a === null ? n.clone() : new e.Vector3(r, i, a);
}
function At(t) {
	if (!t) return new e.Quaternion();
	let n = M(t.x ?? t.X), r = M(t.y ?? t.Y), i = M(t.z ?? t.Z), a = M(t.w ?? t.W);
	return n === null || r === null || i === null || a === null ? new e.Quaternion() : jt(new e.Quaternion(n, r, i, a));
}
function jt(e) {
	let t = Math.fround, n = t(e.x), r = t(e.y), i = t(e.z), a = t(e.w), o = t(n * n), s = t(r * r), c = t(i * i), l = t(a * a), u = t(t(o + s) + t(c + l)), d = t(t(s + c) + t(l + o)), f = t(Math.sqrt(u)), p = t(Math.sqrt(d));
	return e.set(u > t(1e-30) ? t(n / f) : 0, d > t(1e-30) ? t(r / p) : 0, u > t(1e-30) ? t(i / f) : 0, d > t(1e-30) ? t(a / p) : 1);
}
function Mt(t) {
	return new e.Vector3(-t.x, t.y, t.z);
}
function Nt(e) {
	return Mt(e);
}
function Pt(t) {
	return new e.Quaternion(t.x, -t.y, -t.z, t.w);
}
function Ft(e) {
	return Nt(kt[e]);
}
function A(e, t) {
	let n = Math.fround;
	t.identity();
	for (let r = e; r; r = r.parent) {
		let e = n(r.quaternion.x), i = n(r.quaternion.y), a = n(r.quaternion.z), o = n(r.quaternion.w), s = r.scale.x < 0 ? -1 : 1, c = r.scale.y < 0 ? -1 : 1, l = r.scale.z < 0 ? -1 : 1, u = t.x * c * l, d = t.y * s * l, f = t.z * s * c, p = t.w;
		t.set(n(n(n(n(i * f) - n(a * d)) + n(o * u)) + n(e * p)), n(n(n(n(a * u) - n(e * f)) + n(o * d)) + n(i * p)), n(n(n(n(o * f) - n(i * u)) + n(a * p)) + n(e * d)), n(n(n(n(o * p) - n(e * u)) - n(a * f)) - n(i * d)));
	}
	return t;
}
var It = new e.Quaternion();
function j(e, t) {
	let n = Math.fround;
	t.set(n(e.position.x), n(e.position.y), n(e.position.z));
	for (let r = e.parent; r; r = r.parent) t.set(n(t.x * n(r.scale.x)), n(t.y * n(r.scale.y)), n(t.z * n(r.scale.z))), zt(t, r.quaternion), t.set(n(t.x + n(r.position.x)), n(t.y + n(r.position.y)), n(t.z + n(r.position.z)));
	return t;
}
function Lt(e, t) {
	let n = [];
	for (let t = e; t; t = t.parent) n.push(t);
	let r = Math.fround;
	t.set(r(t.x), r(t.y), r(t.z));
	for (let e = n.length - 1; e >= 0; e--) {
		let i = n[e];
		t.set(r(t.x - r(i.position.x)), r(t.y - r(i.position.y)), r(t.z - r(i.position.z))), zt(t, i.quaternion, !0), t.set(r(t.x * Rt(i.scale.x)), r(t.y * Rt(i.scale.y)), r(t.z * Rt(i.scale.z)));
	}
	return t;
}
function Rt(e) {
	let t = Math.fround, n = t(e), r = Math.abs(n);
	if (r < t(1e-9)) return 0;
	if (!Number.isFinite(n)) return 1 / n;
	let i = 2 ** Math.floor(Math.log2(r)), a = Math.floor((r / i - 1) * 2048), o = t(Math.sign(n) * Math.round(8192 / (1 + (a + .5) / 2048)) / 8192 / i), s = t(o * t(2.000000476837158 - t(o * n)));
	return s = t(s * t(2 - t(s * n))), Number.isNaN(s) ? o : s;
}
function zt(e, t, n = !1) {
	let r = Math.fround, i = e.x, a = e.y, o = e.z, s = n ? -1 : 1, c = s * r(t.x), l = s * r(t.y), u = s * r(t.z), d = r(t.w), f = r(r(-2 * l * l) - r(2 * u * u)), p = r(r(-2 * u * d) - r(-2 * c * l)), m = r(r(2 * c * u) - r(-2 * l * d)), h = r(r(2 * l * c) - r(-2 * u * d)), g = r(r(-2 * u * u) - r(2 * c * c)), _ = r(r(-2 * c * d) - r(-2 * l * u)), v = r(r(-2 * l * d) - r(-2 * u * c)), y = r(r(2 * u * l) - r(-2 * c * d)), b = r(r(-2 * c * c) - r(2 * l * l));
	e.set(r(r(r(f * i) + i) + r(r(p * a) + r(m * o))), r(r(r(h * i) + a) + r(r(g * a) + r(_ * o))), r(r(r(v * i) + o) + r(r(y * a) + r(b * o))));
}
function Bt(e, t) {
	return t.copy(Vt(t, A(e, It)));
}
function Vt(t, n) {
	let r = Math.fround, i = r(n.x * 2), a = r(n.y * 2), o = r(n.z * 2), s = r(n.x * i), c = r(n.y * a), l = r(n.z * o), u = r(n.x * a), d = r(n.x * o), f = r(n.y * o), p = r(n.w * i), m = r(n.w * a), h = r(n.w * o);
	return new e.Vector3(r((1 - (c + l)) * t.x + (u - h) * t.y + (d + m) * t.z), r((u + h) * t.x + (1 - (s + l)) * t.y + (f - p) * t.z), r((d - m) * t.x + (f + p) * t.y + (1 - (s + c)) * t.z));
}
function Ht(t, n, r) {
	let i = Math.fround, a = i(e.MathUtils.clamp(r, 0, 1)), o = i(t.x), s = i(t.y), c = i(t.z), l = i(t.w), u = i(n.x), d = i(n.y), f = i(n.z), p = i(n.w);
	i(i(i(i(o * u) + i(s * d)) + i(c * f)) + i(l * p)) < 0 && (u = -u, d = -d, f = -f, p = -p);
	let m = i(o + i(i(u - o) * a)), h = i(s + i(i(d - s) * a)), g = i(c + i(i(f - c) * a)), _ = i(l + i(i(p - l) * a)), v = i(Math.sqrt(i(i(i(i(m * m) + i(h * h)) + i(g * g)) + i(_ * _))));
	return v > 0 ? new e.Quaternion(i(m / v), i(h / v), i(g / v), i(_ / v)) : new e.Quaternion();
}
function M(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
//#endregion
//#region src/engine/utjSpringBoneRuntime.ts
var Ut = /* @__PURE__ */ function(e) {
	return e[e.NoCollision = 0] = "NoCollision", e[e.HeadIsEmbedded = 1] = "HeadIsEmbedded", e[e.TailCollision = 2] = "TailCollision", e;
}({}), N = 1e-5, Wt = .001, Gt = new e.Vector3(1, 0, 0);
function Kt(t, n) {
	return {
		currTipPos: n.clone(),
		prevTipPos: n.clone(),
		hitNormal: new e.Vector3(0, 0, 0),
		cachedPosition: t.clone(),
		cachedMovement: new e.Vector3(0, 0, 0)
	};
}
function qt(e) {
	let t = gn(e.parentRotation.clone().multiply(e.initialLocalRotation)), n = Vt(e.boneAxis, t);
	return P(n.multiplyScalar(Math.fround(e.springLength))), P(e.headPosition.clone().add(n));
}
function Jt(e, t) {
	let n = Math.fround;
	P(e.currTipPos), P(e.prevTipPos);
	let r = e.currTipPos.clone(), i = P(P(qt(t).sub(e.currTipPos)).multiplyScalar(n(t.stiffnessForce))), a = P(P(P(t.springForce.clone().add(t.externalForce)).add(i)).multiplyScalar(n(.5 * n(t.deltaTime) * n(t.deltaTime)))), o = P(P(e.currTipPos.clone().sub(e.prevTipPos)).multiplyScalar(n(1 - n(t.dragForce))));
	P(e.currTipPos.add(P(a.add(o)))), e.prevTipPos.copy(r);
	let s = P(t.headPosition.clone()), c = P(e.currTipPos.clone().sub(s));
	Math.fround(c.length()) <= Wt && c.copy(t.lengthFallbackDirection ?? t.boneAxis), _n(c), P(c.multiplyScalar(n(t.springLength))), e.currTipPos.copy(P(c.add(s)));
}
function Yt(e, t) {
	let n = P(t.clone());
	P(e.cachedMovement.copy(n).sub(e.cachedPosition)), e.cachedPosition.copy(n);
}
function Xt(t, n, r, i, a, o = Gt) {
	let s = r.clone().sub(n), c = s.length();
	if (c <= Wt) {
		s.copy(o).normalize(), t.copy(n).addScaledVector(s, i);
		return;
	}
	let l = e.MathUtils.clamp(c, i, a);
	t.copy(n).addScaledVector(s, l / c);
}
function Zt(t) {
	if (t.targets.length === 0) return;
	let n = t.springConstant * t.deltaTime * t.deltaTime, r = new e.Vector3();
	for (let e of t.targets) {
		let i = t.currTipPos.clone().sub(e.position), a = i.length();
		if (a <= N) continue;
		let o = a - e.initialLength;
		r.addScaledVector(i, -(n * o) / a);
	}
	t.currTipPos.add(r);
}
function Qt(e, t) {
	let n = 0, r = null, i = e.currTipPos.clone();
	for (let i of Sn(t.colliders)) {
		if (i.enabled === !1) continue;
		let a = tn(i, t.headPosition, e.currTipPos, t.tailRadius, t.springLength);
		t.onColliderCheck?.(i, {
			status: a.status,
			beforeTailPosition: e.currTipPos.clone(),
			afterTailPosition: a.tailPosition.clone(),
			hitNormal: a.hitNormal.clone(),
			details: $t(i, t.headPosition, e.currTipPos, a.tailPosition, t.tailRadius)
		}), a.status !== 0 && (e.currTipPos.copy(a.tailPosition), e.hitNormal.copy(a.hitNormal), r = a.hitNormal, n = a.status, t.onCollision?.(i, a));
	}
	return r && pn(e, r, t.bounce, t.friction, i), n;
}
function $t(e, t, n, r, i) {
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
function en(e, t) {
	let n = t.headPosition.clone();
	n.y -= t.groundHeight;
	let r = e.currTipPos.clone();
	return r.y -= t.groundHeight, rn(n, e.currTipPos.distanceTo(t.headPosition), r, t.tailRadius, 1) === 0 ? !1 : (r.y += t.groundHeight, Xt(e.currTipPos, t.headPosition, r, t.springLength * .5, t.springLength, t.lengthFallbackDirection), e.prevTipPos.copy(e.currTipPos), e.hitNormal.set(0, 1, 0), !0);
}
function tn(e, t, n, r, i) {
	return e.kind === "sphere" ? on(t, n, r, e) : e.kind === "capsule" ? sn(t, n, r, e.start, e.end, e.radius) : e.kind === "panel" ? nn(t, n, r, i, e) : cn(t, n, r, e);
}
function nn(t, n, r, i, a) {
	let o = n.clone().applyMatrix4(a.worldToLocalMatrix), s = r;
	if (o.z >= s) return F(n);
	let c = a.width * .5, l = a.height * .5;
	if (Math.abs(o.x) >= c + s || Math.abs(o.y) >= l + s) return F(n);
	let u = t.clone().applyMatrix4(a.worldToLocalMatrix), d = i, f = 0, p = o.clone();
	if (o.z > 0 || u.z > 0) if (Math.abs(o.y) <= l && Math.abs(o.x) <= c) {
		if (f = rn(u, d, p, s, 2), f === 0) return F(n);
	} else if (Math.abs(o.y) > l) {
		let t = o.y >= 0 ? l : -l, n = new e.Vector3(0, o.y - t, o.z);
		n.lengthSq() <= N * N ? n.set(0, 0, 0) : n.normalize(), p.set(o.x + n.x * s, t + n.y * s, n.z * s), f = 2;
	} else {
		let t = o.x >= 0 ? c : -c, n = new e.Vector3(o.x - t, 0, o.z);
		n.lengthSq() <= N * N ? n.set(0, 0, 0) : n.normalize(), p.set(t + n.x * s, o.y + n.y * s, n.z * s), f = 2;
	}
	else Math.abs(u.y) <= l ? Math.abs(u.x) <= c ? (f = 1, p.set(u.x, u.y, s)) : (f = 2, p.set(o.x < 0 ? -c : c, o.y, o.z)) : (f = 2, p.set(o.x, o.y >= 0 ? l : -l, o.z));
	return {
		status: f,
		tailPosition: p.applyMatrix4(a.localToWorldMatrix),
		hitNormal: wn(new e.Vector3(0, 0, 1), a.localToWorldMatrix)
	};
}
function rn(e, t, n, r, i) {
	if (L(n, i) >= r) return 0;
	let a = L(e, i);
	if (a + t <= r) return n.copy(e), Tn(n, i, a + t), 1;
	let o = (i + 1) % 3, s = (i + 2) % 3, c = L(n, o) - L(e, o), l = L(n, s) - L(e, s), u = Math.sqrt(c * c + l * l);
	if (u > .001) {
		let d = a - r, f = Math.sqrt(t * t - d * d) / u;
		Tn(n, o, L(e, o) + c * f), Tn(n, s, L(e, s) + l * f), Tn(n, i, r);
	} else n.copy(e);
	return 2;
}
function an(t, n, r, i, a, o = a, s = {}) {
	let c = r + a, l = n.clone().sub(i);
	if (l.lengthSq() >= c * c) return F(n);
	if (t.distanceToSquared(i) <= o * o) {
		let n = s.headEmbeddedFallback === !1 ? l.clone().multiplyScalar(1 / Math.sqrt(l.lengthSq())) : I(l, s.headEmbeddedFallback instanceof e.Vector3 ? s.headEmbeddedFallback : t.clone().sub(i).lengthSq() <= N * N ? new e.Vector3(0, 1, 0) : t.clone().sub(i));
		return {
			status: 1,
			tailPosition: i.clone().addScaledVector(n, c),
			hitNormal: n
		};
	}
	let u = dn(t, n.distanceTo(t), i, c);
	if (!u) return s.noIntersectionStatus === 2 ? {
		status: 2,
		tailPosition: n.clone(),
		hitNormal: I(n.clone().sub(i), l)
	} : F(n);
	let d = fn(u, n);
	return {
		status: 2,
		tailPosition: d,
		hitNormal: I(d.clone().sub(i), l)
	};
}
function on(e, t, n, r) {
	let i = e.clone().applyMatrix4(r.worldToLocalMatrix), a = t.clone().applyMatrix4(r.worldToLocalMatrix), o = n, s = Math.abs(r.lossyScaleX) * r.radius, c = an(i, a, o, r.localOffset, s, s, {
		headEmbeddedFallback: !1,
		noIntersectionStatus: 2
	});
	return c.status === 0 ? F(t) : {
		status: c.status,
		tailPosition: c.tailPosition.clone().applyMatrix4(r.localToWorldMatrix),
		hitNormal: wn(c.hitNormal.clone(), r.localToWorldNormalMatrix)
	};
}
function sn(t, n, r, i, a, o) {
	let s = a.clone().sub(i), c = s.lengthSq();
	if (c <= N * N) return an(t, n, r, i, o);
	let l = e.MathUtils.clamp(n.clone().sub(i).dot(s) / c, 0, 1), u = i.clone().addScaledVector(s, l), d = r + o, f = n.clone().sub(u);
	if (f.lengthSq() >= d * d) return F(n);
	if (l <= N) return an(t, n, r, i, o);
	if (l >= 1 - N) return an(t, n, r, a, o);
	let p = I(f, t.clone().sub(u)), m = e.MathUtils.clamp(t.clone().sub(i).dot(s) / c, 0, 1), h = i.clone().addScaledVector(s, m);
	return {
		status: t.distanceToSquared(h) <= o * o ? 1 : 2,
		tailPosition: u.addScaledVector(p, d),
		hitNormal: p
	};
}
function cn(e, t, n, r) {
	let i = ln(e.clone().applyMatrix4(r.worldToLocalMatrix), t.clone().applyMatrix4(r.worldToLocalMatrix), n, r.localStart, r.localEnd, r.radius, r.lossyScaleX);
	if (i.status === 0) return F(t);
	let a = i.tailPosition.clone().applyMatrix4(r.localToWorldMatrix), o = wn(i.hitNormal, r.localToWorldNormalMatrix);
	return {
		status: i.status,
		tailPosition: a,
		hitNormal: o
	};
}
function ln(t, n, r, i, a, o, s = 1) {
	if (o <= 1e-4) return F(n);
	let c = i.y <= a.y ? i : a, l = i.y <= a.y ? a : i, u = c.y, d = l.y;
	return n.y <= u || n.y >= d ? an(t, n, r, n.y < d ? c : l, o, Math.abs(s) * o, {
		headEmbeddedFallback: new e.Vector3(0, 0, 0),
		noIntersectionStatus: 2
	}) : un(t, n, r, o, s);
}
function un(t, n, r, i, a = 1) {
	let o = i + r, s = n.x * n.x + n.z * n.z;
	if (s > o * o) return F(n);
	let c = Math.sqrt(s), l = c > N ? n.x / c : 0, u = c > N ? n.z / c : 0, d = new e.Vector3(o * l, n.y, o * u), f = new e.Vector3(l, 0, u), p = t.x * t.x + t.z * t.z, m = Math.abs(a) * i;
	return {
		status: p <= m * m ? 1 : 2,
		tailPosition: d,
		hitNormal: f
	};
}
function dn(e, t, n, r) {
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
function fn(e, t) {
	let n = t.clone().sub(e.origin), r = e.origin.clone().addScaledVector(e.upVector, n.dot(e.upVector)), i = t.clone().sub(r), a = i.length();
	return a <= N || e.radius <= N ? e.origin.clone() : e.origin.clone().addScaledVector(i, e.radius / a);
}
function pn(e, t, n, r, i = e.currTipPos) {
	let a = I(t, Gt), o = e.prevTipPos.clone(), s = i.clone().sub(o), c = a.clone().multiplyScalar(s.dot(a)), l = s.sub(c).multiplyScalar(1 - r).sub(c.multiplyScalar(n));
	if (l.lengthSq() <= 1e-4) {
		e.prevTipPos.copy(e.currTipPos);
		return;
	}
	e.prevTipPos.copy(e.currTipPos).sub(l);
	let u = e.currTipPos.distanceTo(o), d = l.length(), f = Math.max(d - u, 0);
	f > 0 && e.currTipPos.addScaledVector(l, f / d);
}
function mn(e) {
	if (!e.limit.active) return !1;
	let t = Math.fround, n = e.vector, r = P(e.basisUp.clone()), i = P(e.basisSide.clone()), a = P(e.basisForward.clone());
	P(n);
	let o = t(r.dot(n)), s = P(r.multiplyScalar(o)), c = P(n.clone().sub(s)), l = t(c.length()), u = l <= N ? c.set(0, 0, 0) : c.set(t(c.x / l), t(c.y / l), t(c.z / l)), d = t(i.dot(u)), f = t(Math.asin(d < -1 ? -1 : Number.isNaN(d) ? 1 : Math.min(d, 1))) * t(180 / Math.PI), p = t(f - f * t(e.springStrength) * t(e.deltaTime) * t(e.deltaTime)), m = p <= e.limit.max ? p : e.limit.max, h = p < e.limit.min ? e.limit.min : m, g = h >= 0 ? e.limit.max : e.limit.min, _ = 0;
	if (g < -1e-4 || g > 1e-4) {
		let e = t(h / g);
		e >= 0 && (_ = Math.min(e, 1));
	}
	let v = t(g * _), y = t(g * _ * t(Math.PI / 180)), b = P(i.multiplyScalar(t(Math.sin(y))));
	return P(b.add(P(a.multiplyScalar(t(Math.cos(y)))))), P(b.multiplyScalar(l)), P(n.copy(s).add(b)), v !== p;
}
function hn(t, n, r, i, a) {
	let o = Math.fround, s = r.clone().multiply(i);
	gn(s);
	let c = Vt(new e.Vector3(o(o(n.x) - o(t.x)), o(o(n.y) - o(t.y)), o(o(n.z) - o(t.z))), s.invert());
	if (c.lengthSq() <= N * N) return i.clone();
	_n(c);
	let l = vn(a, c);
	return i.clone().multiply(l);
}
function P(e) {
	return e.set(Math.fround(e.x), Math.fround(e.y), Math.fround(e.z));
}
function gn(e) {
	return e.set(Math.fround(e.x), Math.fround(e.y), Math.fround(e.z), Math.fround(e.w));
}
function _n(e) {
	P(e);
	let t = Math.fround(e.length());
	return t > 1e-5 ? e.set(Math.fround(e.x / t), Math.fround(e.y / t), Math.fround(e.z / t)) : e.set(0, 0, 0);
}
function vn(t, n) {
	let r = Math.fround, i = xn(t.clone()), a = xn(n.clone()), o = bn(i, a);
	if (i.lengthSq() === 0 || a.lengthSq() === 0 || o > .999999) return new e.Quaternion();
	let s = Array(9);
	if (o < -.999999) {
		let t = new e.Vector3(0, i.z, -i.y);
		bn(t, t) < 1e-6 && t.set(-i.z, 0, i.x);
		let n = r(1 / r(Math.sqrt(bn(t, t))));
		P(t.multiplyScalar(n));
		let a = yn(t, i), o = i.toArray(), c = t.toArray(), l = a.toArray();
		for (let e = 0; e < 3; e++) for (let t = 0; t < 3; t++) s[e * 3 + t] = r(r(r(l[t] * l[e]) - r(o[t] * o[e])) - r(c[t] * c[e]));
	} else {
		let e = yn(i, a), t = r(r(1 - o) / bn(e, e)), n = r(e.x * t), c = r(e.y * t), l = r(e.z * t), u = r(e.y * n), d = r(e.z * n), f = r(e.y * l);
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
function yn(t, n) {
	let r = Math.fround;
	return new e.Vector3(r(r(t.y * n.z) - r(t.z * n.y)), r(r(t.z * n.x) - r(t.x * n.z)), r(r(t.x * n.y) - r(t.y * n.x)));
}
function bn(e, t) {
	let n = Math.fround;
	return n(n(n(e.x * t.x) + n(e.y * t.y)) + n(e.z * t.z));
}
function xn(e) {
	let t = Math.fround;
	e.set(t(e.x), t(e.y), t(e.z));
	let n = t(Math.sqrt(bn(e, e)));
	return n >= Math.fround(1e-5) ? e.set(t(e.x / n), t(e.y / n), t(e.z / n)) : e.set(0, 0, 0);
}
function F(t) {
	return {
		status: 0,
		tailPosition: t.clone(),
		hitNormal: new e.Vector3(0, 0, 0)
	};
}
function Sn(e) {
	return [...e].sort((e, t) => Cn(e) - Cn(t));
}
function Cn(e) {
	return e.kind === "capsule" || e.kind === "capsuleLocal" ? 0 : e.kind === "sphere" ? 1 : 2;
}
function I(e, t) {
	return e.lengthSq() <= N * N && e.copy(t), e.lengthSq() <= N * N && e.copy(Gt), e.normalize();
}
function wn(e, t) {
	let n = t.elements, r = e.x, i = e.y, a = e.z;
	return e.set(n[0] * r + n[4] * i + n[8] * a, n[1] * r + n[5] * i + n[9] * a, n[2] * r + n[6] * i + n[10] * a), I(e, Gt);
}
function L(e, t) {
	return t === 0 ? e.x : t === 1 ? e.y : e.z;
}
function Tn(e, t, n) {
	t === 0 ? e.x = n : t === 1 ? e.y = n : e.z = n;
}
//#endregion
//#region src/engine/unityPrefabSpringRuntimeAdapter.ts
var En = 1401298464324817e-60, Dn = Ft("right"), On = Ft("left"), kn = Ft("back"), An = Ft("down"), jn = class t {
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
		let r = Cr(e);
		if (!r) return null;
		n.updateMatrixWorld(!0);
		let i = Yn(n), a = Jn(r), o = er(n), s = [], c = or(r), l = Rn(r, i, s, c), u = nr(r), d = rr(r), f = ir(r, l), p = tr(r), m = Bn(r), h = zn(r, c, m), g = /* @__PURE__ */ new Map(), _ = /* @__PURE__ */ new Map(), v = /* @__PURE__ */ new Map(), y = /* @__PURE__ */ new Map();
		n.traverse((e) => y.set(e, y.size));
		let b = /* @__PURE__ */ new Map();
		for (let e of p.values()) b.set(e, R(i, e.nodePath, e.runtimePartIndex));
		let x = (r.managers ?? []).filter((e) => sr(e.nodePath ?? e.poseRoot, c)).map((e) => ({
			source: e,
			node: R(i, e.nodePath, e.runtimePartIndex),
			nodes: []
		})).sort((e, t) => (y.get(e.node) ?? 0) - (y.get(t.node) ?? 0));
		for (let e of x) {
			let t = e.source, n = Pn(i, t, v), o = e.node ? [...b].filter(([n, r]) => r ? Gr(r, e.node) : n.pathId !== void 0 && t.bonePathIds?.includes(n.pathId)).sort((e, t) => (y.get(e[1]) ?? Infinity) - (y.get(t[1]) ?? Infinity)).map(([e]) => e) : (t.bonePathIds ?? []).map((e) => p.get(e));
			for (let p of o) {
				if (!p || !sr(p.nodePath, c)) continue;
				let o = p.pathId;
				if (!Hn(p, m)) {
					h.rejectedUnverifiedBoneSourceCount += 1;
					continue;
				}
				let v = b.get(p);
				if (!v) {
					s.push(p.nodePath ?? p.nodeName ?? `bone:${o}`);
					continue;
				}
				e.nodes.push(v), _.set(v, p);
				let y = Wn(p, v, a, i), x = R(i, p.pivotNodePath, p.runtimePartIndex), ee = Un(r, t, p, o === void 0 ? void 0 : u.get(o), o === void 0 ? void 0 : d.get(o), t.pathId === void 0 ? void 0 : f.get(t.pathId), l), te = Nn(t, p, v, y, x, cr(i, p), n, ee);
				te && g.set(v, te);
			}
		}
		let ee = [...g.values()];
		ee.sort((e, t) => Wr(e.node) - Wr(t.node));
		let te = x.map((e) => {
			let t = [...new Set(e.nodes)].map((e) => g.get(e)).sort((e, t) => Wr(e.node) - Wr(t.node));
			return {
				source: e.source,
				bones: t,
				animatedBones: new Set(t.filter((t) => br(_.get(t.node), t.node, e.source))),
				gravity: W(e.source.rawGravity),
				forceProviders: Pn(i, e.source, v),
				slowMotionScale: K(e.source.slowMotionScale) ?? 1,
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
		for (let t of this.managerBatches) t.slowMotionScale = Lr(e.slowMotionScale, 1), t.isPaused = e.paused ?? !1;
		for (let t of this.bones) t.stiffnessForce = Lr(e.stiffnessForce, t.originalStiffnessForce), t.dragForce = Lr(e.dragForce, t.originalDragForce), t.windInfluence = Lr(e.windInfluence, t.originalWindInfluence), t.slowMotionScale = Lr(e.slowMotionScale, 1), t.isPaused = e.paused ?? !1;
	}
	clearTimelineControl() {
		this.setTimelineControl({});
	}
	update(t) {
		let n = this.collectWindVolumeOneSelfProviders(), r = new Set(n.filter((e) => e.isActive && e.springManagerPathId !== null).map((e) => e.springManagerPathId)), i = new Set(n.filter((e) => !e.isActive && e.springManagerPathId !== null).map((e) => e.springManagerPathId));
		for (let n of this.managerBatches) {
			let a = n.source;
			if (a.enabled === !1 || a.automaticUpdates === !1) continue;
			this.updateManagerPathId = K(a.pathId), n.isPaused || this.preUpdateColliders(n.bones);
			let o = this.updateManagerPathId !== null && i.has(this.updateManagerPathId) ? !0 : a.isSumOfForcesOnBone !== !1;
			for (let i of n.bones) {
				if (!i.enabled) continue;
				A(i.node.parent, this.parentRotation), j(i.node, this.headPosition);
				let s = n.animatedBones.has(i) ? e.MathUtils.clamp(K(a.dynamicRatio) ?? .5, 0, 1) : 1;
				if (n.isPaused) {
					i.skinAnimationLocalRotation.copy(i.node.quaternion), this.applyBoneRotation(i, s);
					continue;
				}
				!o || this.updateManagerPathId !== null && r.has(this.updateManagerPathId) || (this.computeExternalForce(i, t, n), this.updateBoneSpringAndRotation(i, Sr(t, K(a.simulationFrameRate) ?? 60, n.slowMotionScale), this.externalForce, s));
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
		return e.kind === "ForceVolume" ? (e.node.updateMatrixWorld(!0), A(e.node, this.providerRotation), this.providerForce.set(0, 0, 1).applyQuaternion(this.providerRotation).multiplyScalar(e.strength)) : e.kind === "WindVolume" ? this.computeWindVolume(e, t) : this.computeWindVolumeOneSelfForce(e, t, n);
	}
	computeWindVolume(e, t) {
		let n = e.weight * e.strength;
		if (n <= En || e.period <= .001) return this.providerForce.set(0, 0, 0);
		e.node.updateMatrixWorld(!0), A(e.node, this.providerRotation), t.node.getWorldPosition(this.localBonePosition).applyMatrix4(this.providerWorldToLocal.copy(e.node.matrixWorld).invert());
		let r = -this.localBonePosition.x, i = Math.sin(e.timeFactor + Math.sin(r * e.positionalMultiplier) + Math.cos(this.localBonePosition.z * e.positionalMultiplier));
		return this.providerForce.set(0, 0, 1).applyQuaternion(this.providerRotation).addScaledVector(e.offsetVector, i).normalize().multiplyScalar(n * t.windInfluence);
	}
	computeWindVolumeOneSelfForce(t, n, r) {
		let i = t.weight * t.strength;
		if (i <= En || t.period <= En) return this.providerForce.set(0, 0, 0);
		t.currentTime = Ir(t.currentTime, r, t.period);
		let a = t.currentTime * Math.PI * 2 / t.period;
		if (t.node.updateMatrixWorld(!0), A(t.node, this.providerRotation), this.waveAxis.set(0, 1, 0).applyQuaternion(this.providerRotation), Math.abs(t.spinPeriod) > .001) {
			t.spinTime = Ir(t.spinTime, r, t.spinPeriod);
			let e = t.spinTime * Math.PI * 2 / t.spinPeriod;
			this.providerRight.copy(Dn).applyQuaternion(this.providerRotation), this.providerUp.set(0, 1, 0).applyQuaternion(this.providerRotation), this.waveAxis.copy(this.providerRight).multiplyScalar(Math.cos(e)).addScaledVector(this.providerUp, Math.sin(e));
		}
		let o = Math.max(t.peakDistance, En);
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
		for (let e of this.bones) A(e.node.parent, this.parentRotation), j(e.node, this.headPosition), e.skinAnimationLocalRotation.copy(e.node.quaternion), this.debugAnimatedTip.copy(qt({
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
			A(t.node.parent, this.parentRotation), j(t.node, this.headPosition), this.debugAnimatedTip.copy(qt({
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
				tailBinding: Or(t.tailBinding),
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
				dynamicRatio: yr(t),
				isAnimated: t.isAnimated,
				automaticUpdates: t.automaticUpdates,
				boneEnabled: t.enabled,
				bonePaused: t.isPaused,
				isSumOfForcesOnBone: t.isSumOfForcesOnBone,
				simulationFrameRate: t.simulationFrameRate,
				slowMotionScale: t.slowMotionScale,
				updateSkipReason: Tr(t),
				animatedTipDelta: z(d),
				velocity: z(f),
				springForce: z(t.springForce),
				colliderBindings: t.colliderBindingDiagnostics.map(mr)
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
				tailBinding: Or(t.tailBinding),
				offset: n,
				appliedRotationDegrees: e.MathUtils.radToDeg(t.skinAnimationLocalRotation.clone().normalize().angleTo(t.node.quaternion.clone().normalize())),
				colliderCount: t.colliders.length,
				lastCollisionStatus: t.lastCollisionStatus,
				lastCollisionColliderName: t.lastCollisionInfo?.name ?? null,
				lastCollisionColliderPath: t.lastCollisionInfo?.path ?? null,
				lastCollisionColliderKind: t.lastCollisionInfo?.kind ?? null,
				lastCollisionColliderSourcePathId: t.lastCollisionInfo?.sourcePathId ?? null,
				lastCollisionHitNormal: t.lastCollisionInfo ? z(t.lastCollisionInfo.hitNormal) : null,
				lastAngleLimitApplied: t.lastAngleLimitApplied,
				hasSpringForce: t.springForce.lengthSq() > 1e-8,
				forceProviderCount: t.forceProviders.length,
				stiffnessForce: t.stiffnessForce,
				dragForce: t.dragForce,
				managerDynamicRatio: t.dynamicRatio,
				dynamicRatio: yr(t),
				isAnimated: t.isAnimated,
				automaticUpdates: t.automaticUpdates,
				boneEnabled: t.enabled,
				bonePaused: t.isPaused,
				isSumOfForcesOnBone: t.isSumOfForcesOnBone,
				simulationFrameRate: t.simulationFrameRate,
				slowMotionScale: t.slowMotionScale,
				updateSkipReason: Tr(t),
				animatedTipDelta: z(d),
				velocity: z(f),
				headMovement: z(t.state.cachedMovement),
				gravity: z(t.gravity),
				springForce: z(t.springForce),
				colliderBindings: t.colliderBindingDiagnostics.map(mr)
			});
		}
		i.sort((e, t) => t.offset - e.offset), a.sort((e, t) => t.offset - e.offset);
		let u = wr(i, n), d = Mn(this.bones, this.skinnedBones);
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
			bindingDiagnostics: this.bones.flatMap((e) => e.colliderBindingDiagnostics).map(mr),
			skinnedBoneMatches: c,
			skinnedBoneMisses: l
		};
	}
	updateBoneSpringAndRotation(t, n, r, i) {
		A(t.node.parent, this.parentRotation), j(t.node, this.headPosition);
		let a = this.shouldTraceBone(t) ? this.createTraceEvent(t, n, r, i) : null;
		t.skinAnimationLocalRotation.copy(t.node.quaternion), a && (a.skinAnimationLocalRotation = V(t.skinAnimationLocalRotation)), Yt(t.state, this.headPosition), a && (a.stateAfterCache = H(t.state)), Jt(t.state, {
			headPosition: this.headPosition,
			parentRotation: this.parentRotation,
			initialLocalRotation: t.initialLocalRotation,
			boneAxis: t.boneAxis,
			lengthFallbackDirection: t.boneAxis.clone().applyQuaternion(A(t.node, new e.Quaternion())),
			springLength: t.springLength,
			stiffnessForce: t.stiffnessForce,
			dragForce: t.dragForce,
			springForce: t.springForce,
			externalForce: r,
			deltaTime: n
		}), a && (a.stateAfterUpdateSpring = H(t.state)), this.applyLengthLimits(t, n), a && (a.stateAfterLengthLimits = H(t.state));
		let o = Math.abs(t.radius);
		a && (a.tailRadius = o);
		let s = t.collideWithGround ? en(t.state, {
			headPosition: this.headPosition,
			springLength: t.springLength,
			tailRadius: o,
			groundHeight: t.groundHeight,
			lengthFallbackDirection: t.boneAxis.clone().applyQuaternion(A(t.node, new e.Quaternion())),
			bounce: t.bounce,
			friction: t.friction
		}) : !1;
		a && (a.groundHit = s, a.stateAfterGround = H(t.state)), t.lastCollisionInfo = null;
		let c = [], l = t.enableCollision ? this.buildWorldColliders(t.colliders) : [];
		t.lastCollisionStatus = !s && t.enableCollision ? Qt(t.state, {
			headPosition: this.headPosition,
			springLength: t.springLength,
			tailRadius: o,
			colliders: l,
			bounce: t.bounce,
			friction: t.friction,
			onColliderCheck: a ? (e, t) => {
				c.push(Dr(e, t));
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
		}) : 0, a && (a.collisionChecks = c, a.collisionStatus = t.lastCollisionStatus, a.stateAfterCollisions = H(t.state));
		let u = a ? Er(t) : void 0;
		t.lastAngleLimitApplied = t.enableAngleLimits ? this.applyAngleLimits(t, n, u) : !1, a && u && (a.angleLimit = u, a.stateAfterAngleLimits = H(t.state)), this.resetInvalidTipPosition(t), this.applyBoneRotation(t, i), a && (a.finalLocalRotation = V(t.node.quaternion), this.pushTraceEvent(a));
	}
	applyLengthLimits(t, n) {
		if (!t.enableLengthLimits || t.lengthLimitTargets.length === 0) return;
		let r = t.lengthLimitTargets.map((t) => ({
			position: j(t.node, new e.Vector3()),
			initialLength: t.initialLength
		}));
		Zt({
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
		let i = Bt(r, On.clone()), a = Bt(r, kn.clone()), o = Bt(r, An.clone());
		n && (n.enabled = !0, n.hasPivot = !0, n.pivotName = r.name || null, n.pivotPath = q(r) || null, n.vectorBefore = z(this.angleVector), n.forward = z(i), n.back = z(a), n.down = z(o));
		let s = !1;
		if (e.yAngleLimit) {
			let r = mn({
				basisSide: o,
				basisUp: a,
				basisForward: i,
				springStrength: e.angularStiffness,
				deltaTime: t,
				limit: e.yAngleLimit,
				vector: this.angleVector
			});
			n && (n.yApplied = r, n.afterY = z(this.angleVector)), s = r || s;
		}
		if (e.zAngleLimit) {
			let r = mn({
				basisSide: a,
				basisUp: o,
				basisForward: i,
				springStrength: e.angularStiffness,
				deltaTime: t,
				limit: e.zAngleLimit,
				vector: this.angleVector
			});
			n && (n.zApplied = r, n.afterZ = z(this.angleVector)), s = r || s;
		}
		return e.state.currTipPos.copy(e.state.cachedPosition).add(this.angleVector), e.state.currTipPos.set(Math.fround(e.state.currTipPos.x), Math.fround(e.state.currTipPos.y), Math.fround(e.state.currTipPos.z)), n && (n.vectorAfter = z(this.angleVector)), s;
	}
	applyBoneRotation(e, t = e.dynamicRatio) {
		this.resetInvalidTipPosition(e), this.localRotation.copy(hn(this.headPosition, e.state.currTipPos, this.parentRotation, e.initialLocalRotation, e.boneAxis)), e.node.quaternion.copy(jt(Ht(e.skinAnimationLocalRotation, this.localRotation, t))), e.node.updateMatrix(), e.node.updateMatrixWorld(!0);
	}
	resetInvalidTipPosition(e) {
		Number.isFinite(e.state.currTipPos.x) && Number.isFinite(e.state.currTipPos.y) && Number.isFinite(e.state.currTipPos.z) || (this.debugAnimatedTip.copy(qt({
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
			tailBinding: Or(e.tailBinding),
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
			headPosition: z(this.headPosition),
			parentRotation: V(this.parentRotation),
			initialLocalRotation: V(e.initialLocalRotation),
			skinAnimationLocalRotation: V(e.skinAnimationLocalRotation),
			boneAxis: z(e.boneAxis),
			boneAxisSource: e.boneAxisSource,
			springLength: e.springLength,
			radius: e.radius,
			tailRadius: 0,
			stiffnessForce: e.stiffnessForce,
			dragForce: e.dragForce,
			springForce: z(e.springForce),
			gravity: z(e.gravity),
			externalForce: z(n),
			stateBefore: H(e.state),
			stateAfterCache: H(e.state),
			animatedTip: z(qt({
				headPosition: this.headPosition,
				parentRotation: this.parentRotation,
				initialLocalRotation: e.initialLocalRotation,
				boneAxis: e.boneAxis,
				springLength: e.springLength
			})),
			stateAfterUpdateSpring: H(e.state),
			stateAfterLengthLimits: H(e.state),
			groundHit: !1,
			stateAfterGround: H(e.state),
			collisionStatus: 0,
			collisionChecks: [],
			stateAfterCollisions: H(e.state),
			angleLimit: Er(e),
			stateAfterAngleLimits: H(e.state),
			finalLocalRotation: V(e.node.quaternion)
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
		let n = [...t].sort((e, t) => Vr(e.source) - Vr(t.source));
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
			debugPath: t.source.nodePath ?? q(t.node),
			debugSourcePathId: t.source.pathId,
			localOffset: W(n.sphere.offset),
			radius: Math.max(0, n.sphere.radius ?? .01),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Ur(this.colliderWorldToLocal),
			localToWorldNormalMatrix: new e.Matrix4().makeRotationFromQuaternion(A(t.node, new e.Quaternion())),
			lossyScaleX: Hr(t.node)
		}) : n?.capsule ? (t.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(t.node.matrixWorld), this.colliderWorldToLocal.copy(t.node.matrixWorld).invert(), {
			kind: "capsuleLocal",
			enabled: i,
			debugName: t.source.nodeName ?? t.source.scriptName ?? t.node.name,
			debugPath: t.source.nodePath ?? q(t.node),
			debugSourcePathId: t.source.pathId,
			localStart: W(n.capsule.offset),
			localEnd: W(n.capsule.tail),
			radius: Math.max(0, n.capsule.radius ?? .01),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Ur(this.colliderWorldToLocal),
			localToWorldNormalMatrix: new e.Matrix4().makeRotationFromQuaternion(A(t.node, new e.Quaternion())),
			lossyScaleX: Hr(t.node)
		}) : n?.panel ? (t.node.updateMatrixWorld(!0), this.colliderLocalToWorld.copy(t.node.matrixWorld), this.colliderWorldToLocal.copy(t.node.matrixWorld).invert(), {
			kind: "panel",
			enabled: i,
			debugName: t.source.nodeName ?? t.source.scriptName ?? t.node.name,
			debugPath: t.source.nodePath ?? q(t.node),
			debugSourcePathId: t.source.pathId,
			width: Math.max(0, n.panel.width ?? 0),
			height: Math.max(0, n.panel.height ?? 0),
			localToWorldMatrix: this.colliderLocalToWorld.clone(),
			worldToLocalMatrix: this.colliderWorldToLocal.clone(),
			worldToLocalRadiusScale: Ur(this.colliderWorldToLocal),
			worldToLocalLengthScale: Ur(this.colliderWorldToLocal),
			localToWorldNormalMatrix: new e.Matrix4().makeRotationFromQuaternion(A(t.node, new e.Quaternion()))
		}) : null;
	}
};
function Mn(e, t) {
	let n = /* @__PURE__ */ new Map(), r = [];
	for (let i of e) {
		let e = kr(i.sourceBonePath), a = `${i.runtimePartIndex ?? "null"}|${i.runtimePartType ?? "null"}|${e ?? "null"}`, o = n.get(a);
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
function Nn(t, n, r, i, a, o, s, c) {
	let l = i.tailPosition, u = j(r, new e.Vector3()), d = l.clone().sub(u);
	d.set(Math.fround(d.x), Math.fround(d.y), Math.fround(d.z));
	let f = Math.fround(d.length()), p = r.quaternion.clone(), m = Ar(r, l), h = e.MathUtils.clamp(K(t.dynamicRatio) ?? .5, 0, 1), g = o.map((t) => ({
		node: t.node,
		initialLength: j(t.node, new e.Vector3()).distanceTo(l)
	})), _ = n.rawStiffnessForce ?? 300, v = n.rawDragForce ?? n.dragForce ?? .4, y = Math.max(0, n.rawWindInfluence ?? 1), b = K(t.slowMotionScale) ?? 1, x = t.isPaused === !0;
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
		enabled: n.enabled !== !1,
		enableLengthLimits: t.enableLengthLimits !== !1,
		enableAngleLimits: t.enableAngleLimits !== !1,
		enableCollision: t.enableCollision !== !1,
		collideWithGround: t.collideWithGround === !0,
		groundHeight: t.groundHeight ?? 0,
		isSumOfForcesOnBone: t.isSumOfForcesOnBone !== !1,
		isPaused: x,
		gravity: W(t.rawGravity),
		forceProviders: s,
		node: r,
		state: Kt(u, l),
		initialLocalRotation: p,
		initialLocalScale: r.scale.clone(),
		skinAnimationLocalRotation: p.clone(),
		boneAxis: m.axis,
		boneAxisSource: m.source,
		springLength: f,
		dynamicRatio: h,
		isAnimated: br(n, r, t),
		simulationFrameRate: K(t.simulationFrameRate) ?? 60,
		slowMotionScale: b,
		bounce: K(t.bounce) ?? 0,
		friction: K(t.friction) ?? 1,
		radius: Math.max(0, n.hitRadius ?? .05),
		stiffnessForce: _,
		dragForce: v,
		windInfluence: y,
		originalStiffnessForce: _,
		originalDragForce: v,
		originalWindInfluence: y,
		springForce: W(n.rawSpringForce),
		springConstant: n.rawSpringConstant ?? .5,
		lengthLimitTargets: g,
		angularStiffness: Math.max(0, n.rawAngularStiffness ?? 100),
		pivotNode: a,
		yAngleLimit: vr(n.rawAngleLimits?.y),
		zAngleLimit: vr(n.rawAngleLimits?.z),
		colliders: c.colliders,
		colliderBindingDiagnostics: c.diagnostics,
		lastCollisionStatus: 0,
		lastCollisionInfo: null,
		lastAngleLimitApplied: !1
	};
}
function Pn(e, t, n) {
	return (t.forceProviders ?? []).map((t) => {
		let r = Fn(t), i = r ? n.get(r) : void 0;
		if (i) return i;
		let a = In(e, t);
		return a && r && n.set(r, a), a;
	}).filter((e) => !!e);
}
function Fn(e) {
	let t = typeof e.runtimePartIndex == "number" ? `${e.runtimePartIndex}:` : "";
	return typeof e.sourcePathId == "number" ? `${t}path:${e.sourcePathId}` : e.nodePath ? `${t}nodePath:${e.nodePath}` : null;
}
function In(t, n) {
	let r = n.scriptName ?? "", i = r.endsWith("WindVolumeOneSelf"), a = r.endsWith("WindVolume") && !i, o = r.endsWith("ForceVolume") && !a;
	if (!o && !a && !i) return null;
	let s = R(t, n.nodePath, n.runtimePartIndex) ?? Ln(t, n.nodeName), c = n.raw ?? {};
	if (!s || !Nr(c, "m_Enabled", !0) || n.activeSelf === !1 || n.activeInHierarchy === !1) return null;
	let l = {
		sourcePathId: K(n.sourcePathId),
		node: s,
		springManagerPathId: K(n.springManagerPathId) ?? Pr(c, "<SpringManager>k__BackingField") ?? Pr(c, "_SpringManager_k__BackingField") ?? Pr(c, "springManager")
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
		offsetVector: Mr(c, "offsetVector")
	} : {
		kind: "WindVolumeOneSelf",
		...l,
		isActive: Nr(c, "isActive", !1),
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
function Ln(e, t) {
	if (!t) return null;
	let n = [...new Set(e.nodeByPath.values())].filter((e) => e.name === t);
	return n.length === 1 ? n[0] : null;
}
function Rn(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let a of e.colliders ?? []) {
		if (typeof a.index != "number" || !sr(a.nodePath, r)) continue;
		let e = R(t, a.nodePath, a.runtimePartIndex);
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
function zn(e, t, n) {
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
function Bn(e) {
	let t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), r = !1;
	for (let i of e.prefabGraphs ?? []) {
		Array.isArray(i.monoBehaviours) && (r = !0);
		for (let e of i.monoBehaviours ?? []) Vn(e.scriptName) && (typeof e.pathId == "number" && t.add(e.pathId), e.transformPath && n.add(Qn(e.runtimePartIndex ?? -1, e.transformPath)));
	}
	return {
		hasComponentMetadata: r,
		pathIds: t,
		partPaths: n
	};
}
function Vn(e) {
	let t = e?.trim().toLowerCase();
	return t === "springbone" || t === "sekaispringbone";
}
function Hn(e, t) {
	return !t.hasComponentMetadata || typeof e.pathId == "number" && t.pathIds.has(e.pathId) ? !0 : !!(e.nodePath && t.partPaths.has(Qn(e.runtimePartIndex ?? -1, e.nodePath)));
}
function Un(e, t, n, r, i, a, o) {
	if (!r && !i) return {
		colliders: [],
		diagnostics: a ? [pr(t, n, r, i, null, null, null, `no per-bone collider binding; manager cache not used as fallback; ${_r(a)}`, [])] : []
	};
	let s = i?.sourceKind ?? r?.sourceKind ?? "direct", c = lr(i?.candidateRoots ?? r?.collidersByRoot, o);
	if (s === "colliderFlag" && c.size > 0) {
		let o = dr(c, a), s = fr(e, t, n, i, r, o), l = s.root ? o.get(s.root) ?? [] : [];
		return {
			colliders: l,
			diagnostics: [pr(t, n, r, i, c, i?.defaultRoot ?? r?.defaultRoot, s.root, `${s.reason}; manager cache constrained; ${_r(a)}`, l)]
		};
	}
	let l = hr((i?.selectedColliderIndexes ?? r?.colliders ?? []).map((e) => o.get(e)).filter((e) => !!e), t, n);
	return {
		colliders: l,
		diagnostics: [pr(t, n, r, i, null, i?.defaultRoot ?? r?.defaultRoot, null, `${i?.selectedColliderIndexes ? "bindingDecision.selectedColliderIndexes" : r?.colliders ? "colliderBinding.colliders" : "no direct collider indexes"} / direct serialized collider references / pose root preference; ${_r(a)}`, l)]
	};
}
function Wn(t, n, r, i) {
	n.updateMatrixWorld(!0);
	let a = j(n, new e.Vector3()), o = Bt(n, Ft("right")), s = Math.fround, c = new e.Vector3(s(a.x - s(o.x * s(.1))), s(a.y - s(o.y * s(.1))), s(a.z - s(o.z * s(.1)))), l = t.nodePath ? Zn(r, t.nodePath, t.runtimePartIndex) : void 0, u = l ? Kn(l, r, i, t.runtimePartIndex) : [], d = u.map((e) => e.source.name ?? e.node.name), f = u.map((e) => e.source.transformPath ?? q(e.node));
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
		tailPosition: j(u[0].node, new e.Vector3())
	};
	let p = new e.Vector3(), m = 0;
	for (let t of u) {
		let n = j(t.node, new e.Vector3());
		p.add(n), p.set(s(p.x), s(p.y), s(p.z));
		let r = n.clone().sub(a);
		r.set(s(r.x), s(r.y), s(r.z)), m = s(m + s(r.length()));
	}
	p.set(s(p.x / u.length), s(p.y / u.length), s(p.z / u.length)), m = s(m / u.length);
	let h = Gn(a, p, m);
	return {
		mode: "averageChildren",
		childCount: u.length,
		childNames: d,
		childPaths: f,
		childSources: u.map((e) => e.source),
		tailPosition: h
	};
}
function Gn(t, n, r) {
	let i = Math.fround, a = n.clone().sub(t);
	if (a.set(i(a.x), i(a.y), i(a.z)), a.lengthSq() <= 1e-5 * 1e-5) a.copy(Dn);
	else {
		let e = i(a.length());
		a.set(i(a.x / e), i(a.y / e), i(a.z / e));
	}
	return new e.Vector3(i(t.x + i(a.x * i(r))), i(t.y + i(a.y * i(r))), i(t.z + i(a.z * i(r))));
}
function Kn(e, t, n, r) {
	let i = [];
	for (let a of e.childPathIds ?? []) {
		let e = t.transformByPathId.get(a);
		if (!e || !qn(e, t)) continue;
		let o = R(n, e.transformPath, r ?? e.runtimePartIndex);
		o && i.push({
			source: e,
			node: o
		});
	}
	return i;
}
function qn(e, t) {
	return typeof e.pathId == "number" && t.pivotTransformPathIds.has(e.pathId) ? !1 : !e.transformPath || !t.pivotTransformPaths.has(e.transformPath);
}
function Jn(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set();
	for (let i of e.prefabGraphs ?? []) for (let e of i.transforms ?? []) typeof e.pathId == "number" && t.set(e.pathId, e), e.transformPath && (n.set(e.transformPath, e), typeof e.runtimePartIndex == "number" && r.set(Qn(e.runtimePartIndex, e.transformPath), e));
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
function Yn(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
	return e.traverse((i) => {
		let a = q(i, e);
		if (!a) return;
		t.set(a, i);
		let o = zr(i, e);
		o && o !== a && r.set(o, i);
		let s = $n(i), c = i.userData.pjskTransformPath;
		for (let e of typeof c == "string" && c.length > 0 ? [c] : []) typeof s == "number" && n.set(Qn(s, e), i), t.has(e) || t.set(e, i);
	}), {
		nodeByPath: t,
		nodeByPartPath: n,
		canonicalNodeByPath: r
	};
}
function Xn(e, t) {
	return t ? e.nodeByPath.get(t) ?? e.canonicalNodeByPath.get(t) ?? null : null;
}
function R(e, t, n) {
	if (!t) return null;
	if (typeof n == "number") {
		let r = e.nodeByPartPath.get(Qn(n, t));
		if (r) return r;
	}
	return Xn(e, t);
}
function Zn(e, t, n) {
	return typeof n == "number" ? e.transformByPartPath.get(Qn(n, t)) ?? e.transformByPath.get(t) : e.transformByPath.get(t);
}
function Qn(e, t) {
	return `${e}:${t}`;
}
function $n(e) {
	let t = e.userData.pjskRuntimePartIndex;
	return typeof t == "number" ? t : void 0;
}
function er(e) {
	let t = /* @__PURE__ */ new Set();
	return e.traverse((e) => {
		let n = e;
		if (n.isSkinnedMesh) for (let e of n.skeleton.bones) t.add(e);
	}), t;
}
function tr(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.bones ?? []) typeof n.pathId == "number" && t.set(n.pathId, n);
	return t;
}
function nr(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.colliderBindings ?? []) typeof n.sourceSpringBonePathId == "number" && t.set(n.sourceSpringBonePathId, n);
	return t;
}
function rr(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.bindingDecisions ?? []) typeof n.sourceSpringBonePathId == "number" && t.set(n.sourceSpringBonePathId, n);
	return t;
}
function ir(e, t) {
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
			typeof n == "number" && i && ar(r, i) && e.add(n);
		}
		n.set(r.managerPathId, {
			source: r,
			colliderIndexes: e
		});
	}
	return n;
}
function ar(e, t) {
	let n = e.managerNodePath ?? "", r = t.source.nodePath ?? "", i = t.source.shape;
	return n.endsWith("/Position/PositionOffset/Hip") ? i?.sphere ? /\/(?:Left_Thigh|Right_Thigh)\/CL_/.test(r) || /\/Hip\/CL_HipSphereCollider$/.test(r) : !1 : !0;
}
function or(e) {
	return new Set((e.activeRootProfile?.activeRoots ?? []).map((e) => U(e)).filter((e) => !!e));
}
function sr(e, t) {
	if (t.size === 0) return !0;
	let n = U(kr(e));
	return n !== null && t.has(n);
}
function cr(e, t) {
	let n = [];
	for (let r of t.lengthLimitTargets ?? []) {
		let i = R(e, r.nodePath, r.runtimePartIndex ?? t.runtimePartIndex);
		i && n.push({
			node: i,
			initialLength: 0
		});
	}
	return n;
}
function lr(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let [r, i] of Object.entries(e ?? {})) {
		let e = i.map((e) => t.get(e)).filter((e) => !!e);
		e.length > 0 && n.set(r, e);
	}
	return n;
}
function ur(e, t) {
	return !t || t.colliderIndexes.size === 0 ? e : e.filter((e) => typeof e.source.index == "number" && t.colliderIndexes.has(e.source.index));
}
function dr(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let [r, i] of e.entries()) {
		let e = ur(i, t);
		e.length > 0 && n.set(r, e);
	}
	return n;
}
function fr(e, t, n, r, i, a) {
	if (a.size === 1) return {
		root: a.keys().next().value,
		reason: "single manager-cache root"
	};
	let o = U(kr(n.nodePath));
	if (o && a.has(o)) return {
		root: o,
		reason: "joint root matched candidate root"
	};
	if (t.partKind === "Head" || o === "face") {
		let t = U(e.rootSelectionProfile?.defaultBodyRoot ?? e.activeRootProfile?.defaultBodyRoot);
		if (t && a.has(t)) return {
			root: t,
			reason: "head/face uses runtime defaultBodyRoot"
		};
		if (a.has("body")) return {
			root: "body",
			reason: "head/face body fallback"
		};
	}
	let s = U(r?.defaultRoot);
	if (s && a.has(s)) return {
		root: s,
		reason: "bindingDecision.defaultRoot"
	};
	for (let t of e.activeRootProfile?.activeRoots ?? []) {
		let e = U(t);
		if (e && a.has(e)) return {
			root: e,
			reason: "activeRootProfile active root"
		};
	}
	let c = U(i?.defaultRoot);
	return c && a.has(c) ? {
		root: c,
		reason: "binding.defaultRoot"
	} : {
		root: null,
		reason: c ? `binding.defaultRoot ${c} not available after manager cache` : "no matching root"
	};
}
function pr(e, t, n, r, i, a, o, s, c) {
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
		defaultRoot: U(a),
		selectedRoot: o,
		selectedColliderCount: c.length,
		selectedColliderSourcePathIds: c.map((e) => e.source.pathId).filter((e) => typeof e == "number"),
		selectionReason: s
	};
}
function mr(e) {
	return {
		...e,
		candidateRoots: e.candidateRoots.map((e) => ({
			...e,
			colliderSourcePathIds: [...e.colliderSourcePathIds]
		})),
		selectedColliderSourcePathIds: [...e.selectedColliderSourcePathIds]
	};
}
function hr(e, t, n) {
	let r = gr(t, n);
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
function gr(e, t) {
	return t.nodePath?.startsWith("sit_body/") ? "sit_body/" : t.nodePath?.startsWith("body/") || e.partKind === "Head" || t.nodePath?.startsWith("face/") ? "body/" : null;
}
function _r(e) {
	return e ? `${e.source.managerNodeName ?? "manager"} manager cache (${e.source.sphereColliderIndexes?.length ?? 0} sphere, ${e.source.capsuleColliderIndexes?.length ?? 0} capsule, ${e.source.panelColliderIndexes?.length ?? 0} panel)` : "no manager cache available";
}
function vr(e) {
	return e?.active ? {
		active: !0,
		min: e.min ?? 0,
		max: e.max ?? 0
	} : null;
}
function yr(e) {
	return e.isAnimated ? e.dynamicRatio : 1;
}
function br(e, t, n) {
	let r = xr(n.animatedBoneNames);
	return r.size === 0 ? !1 : r.has(t.name) || typeof e.nodeName == "string" && r.has(e.nodeName);
}
function xr(e) {
	return Array.isArray(e) ? new Set(e.filter((e) => typeof e == "string")) : /* @__PURE__ */ new Set();
}
function Sr(e, t, n) {
	let r = t > 0 ? 1 / t : e;
	return n === 1 ? r : r * n;
}
function Cr(e) {
	let t = Rr(Rr(Rr(e)?.pjskSpringBone)?.runtimeUnitySetup), n = t?.version;
	return n === "0414" || n === 414 ? t : null;
}
function z(e) {
	return {
		x: e.x,
		y: e.y,
		z: e.z,
		length: e.length()
	};
}
function wr(e, t) {
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
function Tr(e) {
	return e.automaticUpdates ? e.enabled ? e.isPaused ? "isPaused=true" : e.isSumOfForcesOnBone ? null : "isSumOfForcesOnBone=false" : "enabled=false" : "automaticUpdates=false";
}
function B(e) {
	return e ? z(e) : null;
}
function V(e) {
	return {
		x: e.x,
		y: e.y,
		z: e.z,
		w: e.w
	};
}
function H(e) {
	return {
		currTipPos: z(e.currTipPos),
		prevTipPos: z(e.prevTipPos),
		hitNormal: z(e.hitNormal),
		cachedPosition: z(e.cachedPosition),
		cachedMovement: z(e.cachedMovement)
	};
}
function Er(e) {
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
function Dr(e, t) {
	return {
		kind: e.kind,
		name: e.debugName ?? null,
		path: e.debugPath ?? null,
		sourcePathId: e.debugSourcePathId ?? null,
		enabled: e.enabled !== !1,
		status: t.status,
		beforeTailPosition: z(t.beforeTailPosition),
		afterTailPosition: z(t.afterTailPosition),
		hitNormal: z(t.hitNormal),
		localHeadPosition: B(t.details.localHeadPosition),
		localTailPositionBefore: B(t.details.localTailPositionBefore),
		localTailPositionAfter: B(t.details.localTailPositionAfter),
		localTailRadius: t.details.localTailRadius ?? null,
		localSphereOrigin: B(t.details.localSphereOrigin),
		localSphereRadius: t.details.localSphereRadius ?? null,
		localCapsuleStart: B(t.details.localCapsuleStart),
		localCapsuleEnd: B(t.details.localCapsuleEnd),
		capsuleRadius: t.details.capsuleRadius ?? null,
		panelWidth: t.details.panelWidth ?? null,
		panelHeight: t.details.panelHeight ?? null
	};
}
function Or(e) {
	return {
		mode: e.mode,
		childCount: e.childCount,
		childNames: [...e.childNames],
		childPaths: [...e.childPaths],
		tailPosition: z(e.tailPosition)
	};
}
function kr(e) {
	if (!e) return null;
	let t = e.indexOf("/");
	return t < 0 ? e : e.slice(0, t);
}
function U(e) {
	return e ? e.endsWith("/") ? e.slice(0, -1) : e : null;
}
function W(t) {
	return Nt(Array.isArray(t) ? new e.Vector3(t[0] ?? 0, t[1] ?? 0, t[2] ?? 0) : k(t, new e.Vector3()));
}
function Ar(e, t) {
	e.updateMatrixWorld(!0);
	let n = jr(Lt(e, t.clone()));
	return n ? {
		axis: n,
		source: "computed-local-tip"
	} : {
		axis: Dn.clone(),
		source: "fallback-local-tip"
	};
}
function jr(t) {
	let n = Math.fround(t.length());
	return n <= 1e-5 ? null : new e.Vector3(Math.fround(t.x / n), Math.fround(t.y / n), Math.fround(t.z / n));
}
function G(e, t, n) {
	return K(e[t] ?? e[Fr(t)]) ?? n;
}
function Mr(t, n) {
	let r = t[n] ?? t[Fr(n)];
	return Array.isArray(r) || typeof r == "object" && r ? W(r) : new e.Vector3();
}
function Nr(e, t, n) {
	let r = e[t] ?? e[Fr(t)];
	return typeof r == "boolean" ? r : typeof r == "number" ? r !== 0 : n;
}
function Pr(e, t) {
	let n = Rr(e[t] ?? e[Fr(t)]);
	return K(n?.m_PathID ?? n?.m_pathID ?? n?.pathId);
}
function Fr(e) {
	return e.length > 0 ? e[0].toUpperCase() + e.slice(1) : e;
}
function Ir(t, n, r) {
	return r > 0 ? e.MathUtils.euclideanModulo(t + n, r) : t + n;
}
function Lr(e, t) {
	return typeof e == "number" && Number.isFinite(e) ? e : t;
}
function K(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
function Rr(e) {
	return e && typeof e == "object" ? e : null;
}
function q(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(r.name), r = r.parent;
	return n.join("/");
}
function zr(e, t) {
	let n = [], r = e;
	for (; r && r !== t;) r.name && !r.name.startsWith("Loaded:") && n.unshift(Br(r.name)), r = r.parent;
	return n.join("/");
}
function Br(e) {
	return e.replace(/_([1-9]\d*)$/, "");
}
function Vr(e) {
	return e.shape?.sphere ? 0 : e.shape?.capsule ? 1 : 2;
}
function Hr(t) {
	return t.getWorldScale(new e.Vector3()).x;
}
function Ur(e) {
	let t = e.elements;
	return Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]);
}
function Wr(e) {
	let t = 0, n = e;
	for (; n;) t += 1, n = n.parent;
	return t;
}
function Gr(e, t) {
	for (let n = e; n; n = n.parent) if (n === t) return !0;
	return !1;
}
//#endregion
//#region src/engine/prefabNodeLookup.ts
function Kr(e) {
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
var qr = 7, Jr = class {
	graph;
	setup;
	constraints;
	constructor(e, t, n) {
		this.graph = e, this.setup = t, e.root.updateMatrixWorld(!0);
		let r = Array.isArray(t.constraints) ? t.constraints : [];
		this.constraints = r.map((t) => Zr(e, t, n));
	}
	update() {
		this.graph.root.updateMatrixWorld(!0);
		let e = this.constraints.map(Qr);
		return this.graph.root.updateMatrixWorld(!0), Xr(this.setup, e);
	}
};
function Yr(e, t, n) {
	if (!t) return null;
	let r = Array.isArray(t.constraints) ? t.constraints : [];
	e.root.updateMatrixWorld(!0);
	let i = r.map((t) => Zr(e, t, n)).map(Qr);
	return e.root.updateMatrixWorld(!0), Xr(t, i);
}
function Xr(e, t) {
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
function Zr(e, t, n) {
	let r = X(t.type) ?? "unknown", i = X(t.ownerPath), a = X(t.ownerName), o = ri(e, i, a), s = ri(e, X(t.worldUpObjectPath), X(t.worldUpObjectName)).node, c = (Array.isArray(t.sources) ? t.sources : []).map((t) => ei(e, t, n, r !== "position"));
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
function Qr(e) {
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
	let d = s.filter(ni);
	return n === "parent" ? gi(a.node, d, t) ? $r(n, r, i, c, "parent constraint applied with height-scaled translation offsets") : l("skipped", "parent constraint has no positive source weight") : n === "rotation" ? vi(a.node, d, t) ? $r(n, r, i, c, "rotation constraint applied with weighted source rotations") : l("skipped", "rotation constraint has no positive source weight") : n === "position" ? _i(a.node, d, t) ? $r(n, r, i, c, "position constraint applied in the parent space") : l("skipped", "position constraint has no positive source weight") : n === "aim" ? yi(a.node, d, t, o) ? $r(n, r, i, c, "aim constraint applied with exported aim/up vectors") : l("skipped", "aim constraint target direction or source weight was invalid") : l("skipped", `unsupported constraint type ${n}`);
}
function $r(e, t, n, r, i) {
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
function ei(e, t, n, r) {
	let i = X(t.sourcePath), a = X(t.sourceName), o = r ? ti(e, i, a) : ri(e, i, null), s = Ci(t.weight) ?? 1, c = xi(t.translationOffset, n), l = Si(t.rotationOffset);
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
function ti(e, t, n) {
	if (n) {
		let t = null;
		if (e.root.traverse((e) => {
			!t && e.name === n && (t = e);
		}), t) return {
			node: t,
			reason: "rebound by transform name in the combined model"
		};
	}
	return ri(e, t, n);
}
function ni(e) {
	return !!e.node;
}
function ri(e, t, n) {
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
var ii = (t) => new e.Vector3(-t.x, t.y, t.z), ai = (t) => new e.Quaternion(t.x, -t.y, -t.z, t.w), oi = ii, si = ai;
function ci(t) {
	return t.updateMatrixWorld(!0), ii(t.getWorldPosition(new e.Vector3()));
}
function li(t) {
	return ai(A(t, new e.Quaternion()));
}
function ui(t) {
	return new e.Quaternion().setFromEuler(new e.Euler(e.MathUtils.degToRad(t.x), e.MathUtils.degToRad(t.y), e.MathUtils.degToRad(t.z), "YXZ"));
}
function di(t) {
	let n = new e.Euler().setFromQuaternion(t, "YXZ");
	return new e.Vector3(e.MathUtils.radToDeg(n.x), e.MathUtils.radToDeg(n.y), e.MathUtils.radToDeg(n.z));
}
function fi(t, n) {
	let r = t.clone().normalize(), i = new e.Vector3().crossVectors(n, r);
	if (i.lengthSq() < 1e-12) return new e.Quaternion().setFromUnitVectors(new e.Vector3(0, 0, 1), r);
	i = i.normalize();
	let a = new e.Vector3().crossVectors(r, i);
	return new e.Quaternion().setFromRotationMatrix(new e.Matrix4().makeBasis(i, a, r));
}
function pi(t, n) {
	let r = t.reduce((e, t) => e + Math.max(0, t.weight), 0);
	if (r <= 0) return null;
	let i = new e.Vector3();
	for (let e of t) {
		let t = Math.max(0, e.weight);
		if (t <= 0) continue;
		let a = ci(e.node);
		n && a.add(n(e, li(e.node))), i.addScaledVector(a, t / r);
	}
	return i;
}
function mi(e, t) {
	let n = null, r = 0;
	for (let i of e) {
		let e = Math.max(0, i.weight);
		e <= 0 || (n = bi(n, t(i), r, e), r += e);
	}
	return n;
}
function hi(t, n, r, i, a = null) {
	let o = e.MathUtils.clamp(Ci(n.weight) ?? 1, 0, 1), s = li(t.parent);
	if (i) {
		let r = s.clone().invert().multiply(i).normalize(), a = Ci(n.rotationAxis) ?? qr, c = n.rotationAtRest ? Y(n.rotationAtRest) : di(ai(t.quaternion)), l = di(r), u = ui(new e.Vector3(J(a, 1) ? l.x : c.x, J(a, 2) ? l.y : c.y, J(a, 4) ? l.z : c.z)), d = ui(c).slerp(u, o).normalize();
		t.quaternion.copy(si(d));
	}
	if (r && t.parent) {
		t.parent.updateMatrixWorld(!0);
		let i = ii(t.parent.worldToLocal(oi(r)));
		a && i.add(a);
		let s = Ci(n.translationAxis) ?? qr, c = n.translationAtRest ? Y(n.translationAtRest) : ii(t.position), l = new e.Vector3(J(s, 1) ? i.x : c.x, J(s, 2) ? i.y : c.y, J(s, 4) ? i.z : c.z);
		t.position.copy(oi(c.clone().lerp(l, o)));
	}
	t.updateMatrix(), t.updateMatrixWorld(!0);
}
function gi(t, n, r) {
	let i = pi(n, (t, n) => t.translationOffset ? ii(t.translationOffset).applyQuaternion(n) : new e.Vector3()), a = mi(n, (t) => li(t.node).multiply(t.rotationOffset ? ui(t.rotationOffset) : new e.Quaternion()));
	return !i || !a ? !1 : (hi(t, r, i, a), !0);
}
function _i(t, n, r) {
	let i = pi(n);
	return i ? (hi(t, r, i, null, r.translationOffset ? Y(r.translationOffset) : new e.Vector3()), !0) : !1;
}
function vi(e, t, n) {
	let r = mi(t, (e) => li(e.node));
	if (!r) return !1;
	let i = Si(n.rotationOffset);
	return i && r.multiply(ui(i)), hi(e, n, null, r), !0;
}
function yi(t, n, r, i) {
	let a = pi(n);
	if (!a) return !1;
	let o = ci(t), s = a.clone().sub(o);
	if (s.lengthSq() < 1e-12) return !1;
	let c = Y(r.aimVector ?? {
		x: 0,
		y: 0,
		z: 1
	}), l = Y(r.upVector ?? {
		x: 0,
		y: 1,
		z: 0
	}), u = Y(r.worldUpVector ?? {
		x: 0,
		y: 1,
		z: 0
	}), d;
	switch (Ci(r.worldUpType) ?? 0) {
		case 1:
			d = i ? ci(i).sub(o) : new e.Vector3(0, 1, 0);
			break;
		case 2:
			d = i ? u.clone().applyQuaternion(li(i)) : u.clone();
			break;
		case 3:
			d = u.clone();
			break;
		case 4:
			d = null;
			break;
		default: d = new e.Vector3(0, 1, 0);
	}
	let f = d ? fi(s, d).multiply(fi(c, l).invert()) : new e.Quaternion().setFromUnitVectors(c.clone().normalize(), s.clone().normalize()), p = Si(r.rotationOffset);
	return p && f.multiply(ui(p)), hi(t, r, null, f.normalize()), !0;
}
function J(e, t) {
	return (e & t) !== 0;
}
function Y(t) {
	return k(t, new e.Vector3());
}
function bi(e, t, n, r) {
	if (!e) return t.clone();
	let i = t.clone();
	return e.dot(i) < 0 && i.set(-i.x, -i.y, -i.z, -i.w), e.slerp(i, r / (n + r)).normalize();
}
function xi(t, n) {
	return !t || typeof t != "object" ? null : Mt(k(t, new e.Vector3())).multiplyScalar(n);
}
function Si(t) {
	return !t || typeof t != "object" ? null : k(t, new e.Vector3());
}
function X(e) {
	return typeof e == "string" ? e : null;
}
function Ci(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : null;
}
//#endregion
//#region src/engine/unityPrefabRuntime.ts
function wi(e, t) {
	let n = t, r = e.nodeByPath.get("body/Position");
	if (!r) throw Error("Official CharacterModel PositionNote 'body/Position' was not found.");
	return r.scale.setScalar(n), r.updateMatrix(), e.root.updateMatrixWorld(!0), r;
}
function Ti(e) {
	return e && typeof e == "object" ? e : {};
}
function Z(e) {
	let t = Ti(Ti(Ti(e).pjskSpringBone).runtimeUnitySetup);
	return t.version === "0414" ? t : null;
}
function Ei(e) {
	let t = Ti(Ti(e).nativeMeshes);
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
function Di(e) {
	return e?.parentingMode === "model_combine_setup";
}
function Oi(e, t) {
	e.parent && e.parent.remove(e), t.add(e), e.updateMatrix();
}
function ki(e, t) {
	for (; e.children.length > 0;) Oi(e.children[0], t);
}
function Ai(e, t, n) {
	let r = [], i = /* @__PURE__ */ new Set();
	for (let a of t) {
		let t = e.get(a);
		t && !i.has(t) && (Oi(t, n), i.add(t), r.push(a));
	}
	return r;
}
function ji(e, t, n) {
	e.parent && e.parent.remove(e);
	let r = /* @__PURE__ */ new Set();
	e.traverse((e) => {
		e.userData.pjskModelCombineDestroyed = !0, r.add(e);
	});
	for (let [e, n] of t.entries()) r.has(n) && t.delete(e);
	for (let [e, t] of n.entries()) r.has(t) && n.delete(e);
}
function Mi(e, t, n) {
	for (let [r, i] of e.entries()) i === t && e.set(r, n);
}
function Ni(e, t, n, r, i) {
	let a = r.childMoveSuffix ?? "_target", o = r.parentRootPath, s = r.childRootPath, c = Q(t, [r.parentCombineNodeAPath ?? r.parentAttachPath]), l = Q(t, [r.parentCombineNodeBPath]), u = Q(t, [r.childCombineNodeAPath ?? r.childOriginPath]), d = Q(t, [r.childCombineNodeBPath]), f = Q(t, [s]);
	if (!o || !s || !c || !l || !u || !d || !f) throw Error("Official model_combine_setup paths were not fully resolved.");
	ki(l.node, d.node);
	let p = c.node.parent, m = u.node.parent;
	if (p && m) {
		for (let e of [...p.children]) e.name.endsWith(a) && Oi(e, m);
		let e = Ai(t, i, t.get(o) ?? p), n = i.filter((t) => !e.includes(t));
		if (n.length > 0) throw Error(`Official model_combine_setup head renderers were not moved: ${n.join(", ")}.`);
		let c = `${s}/${r.faceRendererName ?? "Face"}`;
		if (!e.includes(c)) throw Error(`Official model_combine_setup face renderer '${c}' was not moved.`);
		Oi(u.node, p);
	}
	return u.node.position.copy(c.node.position), u.node.quaternion.copy(c.node.quaternion), u.node.scale.copy(c.node.scale), u.node.updateMatrix(), d.node.position.copy(l.node.position), d.node.quaternion.copy(l.node.quaternion), d.node.scale.copy(l.node.scale), d.node.updateMatrix(), Mi(n, c.node, u.node), Mi(n, l.node, d.node), ji(l.node, t, n), ji(c.node, t, n), ji(f.node, t, n), t.set(c.path, u.node), t.set(l.path, d.node), r.parentAttachPath && t.set(r.parentAttachPath, u.node), r.parentCombineNodeBPath && t.set(r.parentCombineNodeBPath, d.node), e.updateMatrixWorld(!0), {
		bodyNodeA: c,
		bodyNodeB: l,
		faceNodeA: u,
		faceNodeB: d
	};
}
function Pi(e, t) {
	return [...new Set((Z(e)?.prefabGraphs ?? []).flatMap((e) => e.renderers ?? []).filter((e) => e.typeName === "SkinnedMeshRenderer").map((e) => e.transformPath).filter((e) => !!(e && e.startsWith(`${t}/`))))];
}
function Fi(e, t) {
	let n = Z(e), r = n?.bodyHeadAssembly?.childRootPath, i = t.rendererTransformPath;
	if (!r || !i?.startsWith(`${r}/`)) return !1;
	let a = (n.prefabGraphs ?? []).flatMap((e) => e.renderers ?? []).filter((e) => e.transformPath === i);
	return a.length > 0 && a.every((e) => e.typeName !== "SkinnedMeshRenderer");
}
function Ii(e, t) {
	return (Ei(e)?.meshes ?? []).find((e) => e.rendererTransformPath?.startsWith(`${t}/`) && typeof e.rootBonePath == "string")?.rootBonePath ?? null;
}
function Li(e, t) {
	let n = e, r = /* @__PURE__ */ new Set();
	for (; typeof n.parentPathId == "number";) {
		if (typeof n.pathId == "number" && !r.add(n.pathId)) throw Error(`Runtime prefab graph contains a parent cycle at PathID ${n.pathId}.`);
		let e = t.get(n.parentPathId);
		if (!e) break;
		n = e;
	}
	return n;
}
function Ri(e) {
	let t = e.transformPath?.split("/")[0];
	return t ? `${e.runtimePartIndex ?? -1}:${t}` : null;
}
function zi(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of Ei(e)?.meshes ?? []) {
		if (typeof r.rendererTransformPathId != "number") continue;
		let e = t.get(r.rendererTransformPathId);
		if (!e) continue;
		let i = Li(e, t), a = Ri(e);
		if (!a || typeof i.pathId != "number") continue;
		let o = n.get(a);
		if (o !== void 0 && o !== i.pathId) throw Error(`Runtime native meshes reference multiple Unity prefab instances for '${a}' (${o}, ${i.pathId}).`);
		n.set(a, i.pathId);
	}
	return n;
}
function Bi(t, n) {
	let r = n.prefabGraphs ?? [], i = new e.Group();
	i.name = "UnityPrefabSourceRoot", i.userData.pjskUnityPrefabSourceGraph = !0;
	let a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map();
	for (let e of r) for (let t of e.transforms ?? []) typeof t.pathId != "number" || !t.transformPath || (o.set(t.pathId, t), c.set(t.transformPath, (c.get(t.transformPath) ?? 0) + 1));
	let l = new Set([...c.entries()].filter(([, e]) => e > 1).map(([e]) => e)), u = zi(t, o);
	for (let t of r) for (let n of t.transforms ?? []) {
		if (typeof n.pathId != "number" || !n.transformPath) continue;
		let t = new e.Object3D();
		t.name = n.name ?? n.transformPath.split("/").pop() ?? `path_${n.pathId}`, t.userData.pjskTransformPath = n.transformPath, t.userData.pjskRuntimePartIndex = n.runtimePartIndex, t.userData.pjskPoseRoot = n.poseRoot ?? null, t.position.copy(Mt(k(n.localPosition, new e.Vector3()))), t.quaternion.copy(Pt(At(n.localRotation))), t.scale.copy(k(n.localScale, new e.Vector3(1, 1, 1))), t.updateMatrix(), a.set(n.pathId, t);
		let r = Li(n, o), i = u.get(Ri(n) ?? "");
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
function Vi(e, t) {
	let n = Z(e);
	if (!n?.prefabGraphs?.length) return null;
	let { root: r, nodeByPath: i, nodeByPathId: a, ambiguousPaths: o } = Bi(e, n);
	r.updateMatrixWorld(!0);
	let s = Ui(r), c = n.bodyHeadAssembly;
	if (!Di(c)) throw Error("Runtime package must provide the official model_combine_setup body/head assembly.");
	let l = Q(i, [c.parentAttachPath]), u = Q(i, [c.childRootPath]), d = Q(i, [c.childOriginPath]);
	if (!l || !u || !d) throw Error("Official model_combine_setup body/head roots were not fully resolved.");
	let f = Pi(e, u.path), p = Ni(r, i, a, c, f), m = Ii(e, l.path.split("/")[0]), h = m ? i.get(m) ?? null : null, g = Ui(r), _ = s - g, v = [];
	if (t) {
		let e = Kr(t);
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
			modelCombineBodyNeck: ia(p.bodyNodeA.node, r),
			modelCombineFaceNeck: ia(p.faceNodeA.node, r)
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
function Hi(e) {
	let t = Z(e);
	if (!t?.prefabGraphs?.length) return null;
	let { root: n, nodeByPath: r, nodeByPathId: i, ambiguousPaths: a } = Bi(e, t), o = Ui(n);
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
function Ui(e) {
	let t = 0;
	return e.traverse((n) => {
		n !== e && (t += 1);
	}), t;
}
function Wi(t, n) {
	let r = Ei(n), i = r?.meshes ?? [];
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
		if (Fi(n, r)) continue;
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
		let m = Ji(r);
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
			let n = qi(r, x.length, c), a = b.matrixWorld.clone();
			if (n.length > 0) {
				let e = a.clone().invert();
				for (let t of n) t.multiply(e);
			}
			let o = new e.Skeleton(x, n.length > 0 ? n : void 0);
			n.length === 0 && o.calculateInverses(), b.bind(o, a);
			let l = Gi(x[0], o.boneInverses[0]), u = Ki(x, o.boneInverses), d = i && t.headRendererPaths.includes(i) ? t.bodyRootBone ?? null : typeof r.rootBonePathId == "number" ? t.nodeByPathId.get(r.rootBonePathId) ?? null : r.rootBonePath ? t.nodeByPath.get(r.rootBonePath) ?? null : null;
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
function Gi(t, n) {
	let r = new e.Matrix4().multiplyMatrices(t.matrixWorld, n), i = new e.Vector3(), a = new e.Quaternion(), o = new e.Vector3();
	return r.decompose(i, a, o), {
		restTranslation: na(i),
		restScale: na(o)
	};
}
function Ki(t, n) {
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
function qi(t, n, r) {
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
function Ji(t) {
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
function Yi(e, t, n, r) {
	e.root.updateMatrixWorld(!0);
	let i = r ? r.update() : Yr(e, Z(t)?.constraintSetup, n);
	for (let t of e.meshCarrierBindings) t.target.position.copy(t.source.position), t.target.quaternion.copy(t.source.quaternion), t.target.scale.copy(t.source.scale), t.target.updateMatrix();
	return e.root.updateMatrixWorld(!0), i;
}
function Xi(e, t, n) {
	let r = Z(t)?.constraintSetup;
	return r ? new Jr(e, r, n) : null;
}
function Zi(e, t, n) {
	let r = {
		...e?.debug ?? n,
		setupVersion: Qi(t)
	};
	if (!e) return r;
	let i = e.root;
	i.updateMatrixWorld(!0);
	let a = Z(t)?.bodyHeadAssembly, o = Kr(i), s = (t) => {
		let n = Q(e.nodeByPath, t) ?? $i(o, t);
		return n ? ia(n.node, i) : null;
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
		positionRoots: aa(i),
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
function Qi(e) {
	return Z(e) ? "0414" : "";
}
function $i(e, t) {
	for (let n of t) {
		let t = e.get(n);
		if (t) return {
			node: t,
			path: n
		};
	}
	return null;
}
function ea(e) {
	return e.replace(/_\d+$/, "");
}
function ta(e, t, n = !1) {
	let r = [], i = e;
	for (; i && i !== t;) i.name && r.push(n ? ea(i.name) : i.name), i = i.parent;
	return r.reverse().join("/");
}
function na(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5))
	};
}
function ra(e) {
	return {
		x: Number(e.x.toFixed(5)),
		y: Number(e.y.toFixed(5)),
		z: Number(e.z.toFixed(5)),
		w: Number(e.w.toFixed(5))
	};
}
function ia(t, n) {
	t.updateMatrixWorld(!0);
	let r = new e.Vector3(), i = new e.Quaternion(), a = new e.Vector3(0, 0, 1);
	return t.getWorldPosition(r), A(t, i), a.applyQuaternion(i).normalize(), {
		path: ta(t, n),
		canonicalPath: ta(t, n, !0),
		parentPath: t.parent && t.parent !== n ? ta(t.parent, n) : null,
		destroyed: t.userData.pjskModelCombineDestroyed === !0,
		localPosition: na(t.position),
		localQuaternion: ra(t.quaternion),
		worldPosition: na(r),
		worldQuaternion: ra(i),
		worldForward: na(a)
	};
}
function aa(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	return e.updateMatrixWorld(!0), e.traverse((r) => {
		if (r === e || !r.name || n.has(r)) return;
		let i = ta(r, e, !0), a = i === "face/Position", o = i === "body/Position", s = i.endsWith("/Position") && i.split("/").some((e) => e.startsWith("mdl_chr_"));
		!a && !o && !s || (n.add(r), t.push(ia(r, e)));
	}), t;
}
//#endregion
export { i as A, Ct as C, h as D, S as E, s as O, Et as S, qe as T, Pt as _, Wi as a, Dt as b, Kr as c, Ut as d, Zt as f, mn as g, hn as h, Xi as i, n as j, r as k, jn as l, on as m, Hi as n, Zi as o, cn as p, Vi as r, Yi as s, wi as t, Gn as u, A as v, St as w, Tt as x, jt as y };
