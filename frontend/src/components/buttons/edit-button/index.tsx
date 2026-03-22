import Button from "react-bootstrap/Button";
import styles from "./styles.module.css";
import classnames from "classnames";

type TEditButtonProps = {
    className: string,
    onClickHandler?: any,
    elem?: any
}

export const EditButton = ({ className, onClickHandler, elem }: TEditButtonProps) => {
    return <Button className={classnames(styles.editButton, className)} onClick={onClickHandler} variant="outline-primary">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="19"
            height="19"
            viewBox="0 0 19 19"
            fill="none"
        >
            <path
                d="M13.7384 2.94992L15.2095 1.47877C15.8479 0.840411 16.8829 0.840411 17.5212 1.47877C18.1596 2.11712 18.1596 3.15211 17.5212 3.79046L4.99472 16.317C4.53383 16.7779 3.96535 17.1167 3.34067 17.3027L1 18L1.69724 15.6593C1.88333 15.0347 2.22212 14.4662 2.68302 14.0053L13.7384 2.94992ZM13.7384 2.94992L16.0385 5.24999"
                stroke="#5E7FD6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </Button>
}