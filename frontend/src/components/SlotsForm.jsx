import React from "react";
import Button from "react-bootstrap/Button";
import SlotForm from "../components/SlotForm";
import Image from "react-bootstrap/Image";
import CloseButton from "react-bootstrap/CloseButton";

const SlotsForm = ({ form, onChange }) => {
  const handleAddSlot = () => {
    const newSlots = [
      ...form.slots,
      {
        name: "",
        age: "",
      },
    ];
    const newForm = {
      ...form,
      slots: newSlots,
    };
    onChange(newForm);
  };

  const handleSlotRemoved = (index) => {
    const newSlots = form.slots.filter((v, i) => index !== i);
    const newForm = {
      ...form,
      slots: newSlots,
    };
    onChange(newForm);
  };

  const handleSlotChanged = (child, index) => {
    const newSlots = form.slots.map((it, i) => (i === index ? child : it));
    const newForm = {
      ...form,
      slots: newSlots,
    };
    onChange(newForm);
  };

  return (
    <>
      {form.slots.map((child, index) => (
        <React.Fragment key={index}>
          <div className="child-label">
            <p className="text-muted mb-0">Слот {index + 1}</p>
            <CloseButton onClick={() => handleSlotRemoved(index)} />
          </div>
          <hr className="text-muted mt-0" />
          <SlotForm
            child={child}
            onChange={(value) => handleSlotChanged(value, index)}
          />
        </React.Fragment>
      ))}
      <Button
        variant="outline-primary"
        className="add-child-button d-flex m-auto border"
        onClick={handleAddSlot}
      >
        Добавить слот
      </Button>
    </>
  );
};

export default SlotsForm;
