// @ts-nocheck
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import styles from "./styles.module.css";
import React from "react";
import { useEffect, useState } from "react";
import classnames from "classnames";
import { getExportFile } from "apis/backend";
import "commonStyles.css"
import { AddEventForm } from "./add-event";

export const ExportPage = () => {
    return (
        <>
            <h1>Выгрузка по всем мероприятиям</h1>
            <hr className={styles.hr} />
            <Button
                className={classnames("outline-primary", styles.addButton)}
                variant="outline-primary"
                onClick={() => getExportFile()}
            >
                Скачать файл
            </Button>
        </>
    )
};
