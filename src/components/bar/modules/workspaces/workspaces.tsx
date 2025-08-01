import { initWorkspaceEvents } from './helpers/utils';
import { getAppIcon, getWsColor, renderClassnames, renderLabel } from './helpers';
import { bind, Variable } from 'astal';
import AstalHyprland from 'gi://AstalHyprland?version=0.1';
import { Gtk } from 'astal/gtk3';
import { WorkspaceService } from 'src/services/workspace';
import options from 'src/configuration';
import { isPrimaryClick } from 'src/lib/events/mouse';
import { WorkspaceIconMap, ApplicationIcons } from './types';

const workspaceService = WorkspaceService.getInstance();

const hyprlandService = AstalHyprland.get_default();
const {
    workspaces,
    monitorSpecific,
    workspaceMask,
    spacing,
    ignored,
    showAllActive,
    show_icons,
    show_numbered,
    numbered_active_indicator,
    workspaceIconMap,
    showWsIcons,
    showApplicationIcons,
    applicationIconOncePerWorkspace,
    applicationIconMap,
    showWorkspacesWithRules,
    applicationIconEmptyWorkspace,
    applicationIconFallback,
} = options.bar.workspaces;
const { available, active, occupied } = options.bar.workspaces.icons;
const { matugen } = options.theme;
const { smartHighlight } = options.theme.bar.buttons.workspaces;

initWorkspaceEvents();

export const WorkspaceModule = ({ monitor }: WorkspaceModuleProps): JSX.Element => {
    const boxChildren = Variable.derive(
        [
            bind(monitorSpecific),
            bind(hyprlandService, 'workspaces'),
            bind(workspaceMask),
            bind(workspaces),
            bind(show_icons),
            bind(available),
            bind(active),
            bind(occupied),
            bind(show_numbered),
            bind(numbered_active_indicator),
            bind(spacing),
            bind(workspaceIconMap),
            bind(showWsIcons),
            bind(showApplicationIcons),
            bind(applicationIconOncePerWorkspace),
            bind(applicationIconMap),
            bind(applicationIconEmptyWorkspace),
            bind(applicationIconFallback),
            bind(showWorkspacesWithRules),
            bind(matugen),
            bind(smartHighlight),
            bind(hyprlandService, 'clients'),
            bind(hyprlandService, 'monitors'),

            bind(ignored),
            bind(showAllActive),
            bind(hyprlandService, 'focusedWorkspace'),
            bind(workspaceService.workspaceRules),
            bind(workspaceService.forceUpdater),
        ],
        (
            isMonitorSpecific: boolean,
            workspaceList: AstalHyprland.Workspace[],
            workspaceMaskFlag: boolean,
            totalWorkspaces: number,
            displayIcons: boolean,
            availableStatus: string,
            activeStatus: string,
            occupiedStatus: string,
            displayNumbered: boolean,
            numberedActiveIndicator: string,
            spacingValue: number,
            workspaceIconMapping: WorkspaceIconMap,
            displayWorkspaceIcons: boolean,
            displayApplicationIcons: boolean,
            appIconOncePerWorkspace: boolean,
            applicationIconMapping: ApplicationIcons,
            applicationIconEmptyWorkspace: string,
            applicationIconFallback: string,
            showWorkspacesWithRules: boolean,
            matugenEnabled: boolean,
            smartHighlightEnabled: boolean,
            clients: AstalHyprland.Client[],
            monitorList: AstalHyprland.Monitor[],
        ) => {
            const wsRules = workspaceService.workspaceRules.get();
            const workspacesToRender = workspaceService.getWorkspaces(
                totalWorkspaces,
                workspaceList,
                wsRules,
                monitor,
                isMonitorSpecific,
                showWorkspacesWithRules,
                monitorList,
            );

            return workspacesToRender.map((wsId, index) => {
                const appIcons = displayApplicationIcons
                    ? wsId + ' ' + getAppIcon(wsId, appIconOncePerWorkspace, {
                          iconMap: applicationIconMapping,
                          defaultIcon: applicationIconFallback,
                          emptyIcon: applicationIconEmptyWorkspace,
                      })
                    : '';

                return (
                    <button
                        className={'workspace-button'}
                        onClick={(_, event) => {
                            if (isPrimaryClick(event)) {
                                hyprlandService.dispatch('workspace', wsId.toString());
                            }
                        }}
                    >
                        <label
                            valign={Gtk.Align.CENTER}
                            css={
                                `margin: 0rem ${0.375 * spacingValue}rem;` +
                                `${displayWorkspaceIcons && !matugenEnabled ? getWsColor(workspaceIconMapping, wsId, smartHighlightEnabled, monitor) : ''}`
                            }
                            className={renderClassnames(
                                displayIcons,
                                displayNumbered,
                                numberedActiveIndicator,
                                displayWorkspaceIcons,
                                smartHighlightEnabled,
                                monitor,
                                wsId,
                            )}
                            label={renderLabel(
                                displayIcons,
                                availableStatus,
                                activeStatus,
                                occupiedStatus,
                                displayApplicationIcons,
                                appIcons,
                                workspaceMaskFlag,
                                displayWorkspaceIcons,
                                workspaceIconMapping,
                                wsId,
                                index,
                                monitor,
                            )}
                            setup={(self) => {
                                const currentWsClients = clients.filter(
                                    (client) => client?.workspace?.id === wsId,
                                );
                                self.toggleClassName('occupied', currentWsClients.length > 0);
                            }}
                        />
                    </button>
                );
            });
        },
    );

    return (
        <box
            onDestroy={() => {
                boxChildren.drop();
            }}
        >
            {boxChildren()}
        </box>
    );
};

interface WorkspaceModuleProps {
    monitor: number;
}
