const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([\da-z-]+(?:\.[\da-z-]+)*))?(?:\+([\da-z-]+(?:\.[\da-z-]+)*))?$/i;

export function isValidSemVer(version: string): boolean {
    return semverRegex.test(version);
}

export function compareVersions(versionA: string, versionB: string): VersionDiff {
    const [majorA, minorA, patchA] = versionA.split('.').map(Number);
    const [majorB, minorB, patchB] = versionB.split('.').map(Number);
    
    if (majorA !== majorB) {
        return VersionDiff.MAJOR_DIFF;
    } else if (minorA !== minorB) {
        return VersionDiff.MINOR_DIFF;
    } else if (patchA !== patchB) {
        return VersionDiff.PATCH_DIFF;
    } else {
        return VersionDiff.NO_DIFF;
    }
}

export enum VersionDiff {
    NO_DIFF,
    PATCH_DIFF,
    MINOR_DIFF,
    MAJOR_DIFF
}