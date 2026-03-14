/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import { LayoutContext } from './context/layoutcontext';
import { BASE_PATH } from '@/app/api';

const AppFooter = () => {
    const { layoutConfig } = useContext(LayoutContext);

    return (
        <div className="layout-footer">
            <img src={`${BASE_PATH || ''}/layout/images/logo.svg`} alt="Logo" height="24" className="mr-2" />
            <span className="font-medium ml-2">CDMS-HR v1.0. 2025 © Cornelder de Moçambique</span>
        </div>
    );
};

export default AppFooter;
