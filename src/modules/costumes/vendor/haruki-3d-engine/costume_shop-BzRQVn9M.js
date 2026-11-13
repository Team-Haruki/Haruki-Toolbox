import { C as e } from "./mirrorContent-CQAS0PZS.js";
//#region src/original/roleParts.ts
async function t(t, n) {
	let r = /^(\d+):(.+)$/.exec(String(n).trim());
	if (!r) throw Error(`roleId must be '<characterId>:<unit>', got ${n}`);
	let i = await e(t).roleIndex(Number(r[1]), r[2]);
	return {
		role: i.role,
		units: [...i.units],
		motions: i.motions.map((e) => ({ ...e })),
		notAvailablePatterns: (i.compatibility.rules ?? []).filter((e) => e.state === "not_available").map((e) => ({
			headCostume3dId: e.headCostume3dId,
			hairCostume3dId: e.hairCostume3dId
		})),
		parts: i.registry.map((e) => ({
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
