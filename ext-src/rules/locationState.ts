
export enum LocationState {
    LOCAL = "Workspace Rule - saved only to this workspace",
    GLOBAL = "Global Rule - saved across all workspaces"
}

export function reverseMap(location: LocationState) {
    return location === LocationState.GLOBAL ? 'GLOBAL' : 'LOCAL';
}