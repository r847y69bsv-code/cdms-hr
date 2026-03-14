import React, { Dispatch, SetStateAction, HTMLAttributeAnchorTarget } from 'react';
import { MenuItem } from 'primereact/menuitem';

// Layout Types
export interface LayoutConfig {
    ripple: boolean;
    inputStyle: string;
    menuMode: string;
    colorScheme: string;
    theme: string;
    scale: number;
}

export interface LayoutState {
    staticMenuDesktopInactive: boolean;
    overlayMenuActive: boolean;
    profileSidebarVisible: boolean;
    configSidebarVisible: boolean;
    staticMenuMobileActive: boolean;
    menuHoverActive: boolean;
}

export interface LayoutContextProps {
    layoutConfig: LayoutConfig;
    setLayoutConfig: Dispatch<SetStateAction<LayoutConfig>>;
    layoutState: LayoutState;
    setLayoutState: Dispatch<SetStateAction<LayoutState>>;
    onMenuToggle: () => void;
    showProfileSidebar: () => void;
}

export interface MenuContextProps {
    activeMenu: string;
    setActiveMenu: Dispatch<SetStateAction<string>>;
}

export interface ChildContainerProps {
    children: React.ReactNode;
}

// Menu Types
export interface AppMenuItem extends MenuItem {
    to?: string;
    items?: AppMenuItem[];
    permissions?: string[];
    visible?: boolean;
    replaceUrl?: boolean;
    target?: HTMLAttributeAnchorTarget;
    badgeClass?: string;
}

export interface AppMenuItemProps {
    item?: AppMenuItem;
    parentKey?: string;
    index?: number;
    root?: boolean;
    className?: string;
}

// Topbar Ref
export interface AppTopbarRef {
    menubutton?: HTMLButtonElement | null;
    topbarmenu?: HTMLDivElement | null;
    topbarmenubutton?: HTMLButtonElement | null;
}
