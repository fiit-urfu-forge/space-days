import React from "react";
import Button from "react-bootstrap/Button";
import ChildForm from "../components/ChildForm";
import Image from "react-bootstrap/Image";
import CloseButton from "react-bootstrap/CloseButton";

const ChildrenForm = ({ form, onChange }) => {
  const handleAddChild = () => {
    const newChildren = [
      ...form.children,
      {
        name: "",
        age: "",
      },
    ];
    const newForm = {
      ...form,
      children: newChildren,
    };
    onChange(newForm);
  };

  const handleChildRemoved = (index) => {
    const newChildren = form.children.filter((v, i) => index !== i);
    const newForm = {
      ...form,
      children: newChildren,
    };
    onChange(newForm);
  };

  const handleChildChanged = (child, index) => {
    const newChildren = form.children.map((it, i) =>
      i === index ? child : it
    );
    const newForm = {
      ...form,
      children: newChildren,
    };
    onChange(newForm);
  };

  return (
    <>
      {form.children.map((child, index) => (
        <React.Fragment key={index}>
          <div className="child-label">
            <p className="text-muted mb-0">Ребенок {index + 1}</p>
            <CloseButton onClick={() => handleChildRemoved(index)} />
          </div>
          <hr className="text-muted mt-0" />
          <ChildForm
            child={child}
            onChange={(value) => handleChildChanged(value, index)}
          />
        </React.Fragment>
      ))}
      {form.children.length < 3 && (
        <Button
          variant="outline-primary"
          className="add-child-button rounded-circle d-flex m-auto border"
          onClick={handleAddChild}
        >
          <Image src={require("shared/image/plus.png")} alt="кнопка добавить" />
        </Button>
      )}
    </>
  );
};

export default ChildrenForm;
