import Button from "react-bootstrap/Button";
import styles from "./styles.module.css";
import { deletePartner } from "apis/backend";
import { getPartners } from "apis/backend";
import classnames from "classnames";

type TDeleteButtonProps = {
    className?: string,
    element_id: string,
    updateList: any,
    list: Array<any>,
    deleteHandle: any,
}

export const DeleteButton = ({ className, element_id, updateList, list, deleteHandle }: TDeleteButtonProps) => {

    return <Button className={classnames(styles.deleteButton, className)} onClick={() => deleteHandle(element_id, updateList)} variant="outline-primary">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="17"
            viewBox="0 0 15 17"
            fill="none"
        >
            <path
                d="M9.45414 6.19231L9.18787 13.1154M5.50444 13.1154L5.23817 6.19231M12.9059 3.72351C13.1689 3.76324 13.4311 3.80575 13.6923 3.85099M12.9059 3.72351L12.0845 14.402C12.0151 15.3037 11.2632 16 10.3588 16H4.33352C3.42913 16 2.67721 15.3037 2.60784 14.402L1.78642 3.72351M12.9059 3.72351C12.024 3.59034 11.1319 3.48835 10.2308 3.41871M1 3.85099C1.26121 3.80575 1.52336 3.76324 1.78642 3.72351M1.78642 3.72351C2.66829 3.59034 3.56038 3.48835 4.46154 3.41871M10.2308 3.41871V2.71399C10.2308 1.80679 9.53027 1.04941 8.62353 1.0204C8.1994 1.00684 7.77358 1 7.34615 1C6.91873 1 6.49291 1.00684 6.06878 1.0204C5.16204 1.04941 4.46154 1.80679 4.46154 2.71399V3.41871M10.2308 3.41871C9.27889 3.34515 8.3169 3.30769 7.34615 3.30769C6.37541 3.30769 5.41342 3.34515 4.46154 3.41871"
                stroke="#5E7FD6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </Button>
}