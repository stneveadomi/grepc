export enum LocationState {
    LOCAL = 'Workspace Rule - saved only to this workspace',
    GLOBAL = 'Global Rule - saved across all workspaces',
}

export function reverseMap(location: LocationState) {
    switch (location) {
        case LocationState.LOCAL:
            return 'LOCAL';
        case LocationState.GLOBAL:
            return 'GLOBAL';
        default:
            return location;
    }
}
