import { E as e } from "./mirrorContent-COOInpTd.js";
//#region src/original/roleParts.ts
async function t(t, n) {
	let r = /^(\d+):(.+)$/.exec(String(n).trim());
	if (!r) throw Error(`roleId must be '<characterId>:<unit>', got ${n}`);
	let i = e(t), [a, o] = await Promise.all([i.roleIndex(Number(r[1]), r[2]), i.costumeSources(Number(r[1]))]);
	return {
		sources: o.map((e) => ({ ...e })),
		role: a.role,
		units: [...a.units],
		motions: a.motions.map((e) => ({ ...e })),
		notAvailablePatterns: (a.compatibility.rules ?? []).filter((e) => e.state === "not_available").map((e) => ({
			headCostume3dId: e.headCostume3dId,
			hairCostume3dId: e.hairCostume3dId
		})),
		defaultHairs: (a.compatibility.rules ?? []).filter((e) => e.state === "default_hint").map((e) => ({
			headCostume3dId: e.headCostume3dId,
			hairCostume3dId: e.hairCostume3dId
		})),
		parts: a.registry.filter((e) => !e.presetAlias).map((e) => ({
			costume3dId: e.costume3dId,
			characterId: e.characterId,
			partType: String(e.partType),
			unit: e.unit ?? null,
			status: e.status ?? "ready",
			packagePath: e.packagePath,
			headCostume3dAssetbundleType: e.headCostume3dAssetbundleType ?? null,
			name: e.name ?? null,
			colorId: e.colorId ?? null,
			colorName: e.colorName ?? null,
			costume3dGroupId: e.costume3dGroupId ?? null,
			thumbnailAssetbundleName: e.thumbnailAssetbundleName ?? null
		}))
	};
}
//#endregion
export { t };
