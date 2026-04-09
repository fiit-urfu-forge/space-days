import React, { useState, useCallback } from "react";
import Form from "react-bootstrap/Form";
import SlotsForm from "./SlotsForm";
import Button from "react-bootstrap/Button";
import { addEvent } from "../apis/backend";

const AddEventForm = (partnerId) => {
  const [form, handleFormChange] = useForm();

  const [errorMessage, setErrorMessage] = useState(null);

  const handleRegister = async () => {
    const result = await addEvent(form);
    if (result.ok) {
      alert("Событие добавлено");
      setErrorMessage("Событие успешно добавлено");
      return;
    }

    if (result.status === 422) {
      setErrorMessage("Ошибка в заполнении формы");
      return;
    }

    setErrorMessage(null);
  };

  function useForm() {
    const defaultForm = {
      description: "",
      location: "",
      summary: "",
      title: "",
      age: "",
      duration: "",
      date: "",
      id_partner: partnerId,
      is_children: false,
      slots: [
        {
          start_time: "",
          amount: "",
        },
      ],
    };
    const [form, setForm] = useState(defaultForm);

    const handleFormChange = useCallback((f) => {
      setForm(f);
    }, []);

    return [form, handleFormChange];
  }

  return (
    <Form style={{ width: 1000 }} className="add-event-form">
      <Form.Group controlId="title">
        <Form.Label>Название</Form.Label>
        <Form.Control
          type="text"
          className="rounded"
          value={form.title}
          onChange={(event) =>
            handleFormChange({ ...form, title: event.target.value })
          }
          required
        />
      </Form.Group>
      <Form.Group controlId="description">
        <Form.Label>Описание</Form.Label>
        <Form.Control
          type="text"
          className="rounded"
          value={form.description}
          onChange={(event) =>
            handleFormChange({ ...form, description: event.target.value })
          }
          required
        />
      </Form.Group>
      <Form.Group controlId="summary">
        <Form.Label>Краткое описание</Form.Label>
        <Form.Control
          type="text"
          className="rounded"
          value={form.summary}
          onChange={(event) =>
            handleFormChange({ ...form, summary: event.target.value })
          }
        />
      </Form.Group>
      <Form.Group controlId="location">
        <Form.Label>Место проведения</Form.Label>
        <Form.Control
          type="text"
          className="rounded"
          value={form.location}
          onChange={(event) =>
            handleFormChange({ ...form, location: event.target.value })
          }
          required
        />
      </Form.Group>
      <Form.Group controlId="age">
        <Form.Label>Возраст</Form.Label>
        <Form.Control
          type="text"
          className="rounded"
          value={form.age}
          onChange={(event) =>
            handleFormChange({ ...form, age: event.target.value })
          }
          required
        />
      </Form.Group>
      <Form.Group controlId="duration">
        <Form.Label>Продолжительность</Form.Label>
        <Form.Control
          type="text"
          className="rounded"
          value={form.duration}
          onChange={(event) =>
            handleFormChange({ ...form, duration: event.target.value })
          }
          required
        />
      </Form.Group>
      <Form.Group controlId="date">
        <Form.Label>Дата проведения</Form.Label>
        <Form.Control
          type="text"
          className="rounded"
          value={form.date}
          placeholder="ГГГГ-ММ-ДД"
          onChange={(event) =>
            handleFormChange({ ...form, date: event.target.value })
          }
          required
        />
      </Form.Group>
      <Form.Group controlId="formCheckbox">
        <Form.Check
          type="checkbox"
          className="mb-3"
          label="Только для детей"
          checked={form.is_children}
          onChange={(event) =>
            handleFormChange({ ...form, is_children: event.target.checked })
          }
        />
        <SlotsForm form={form} onChange={handleFormChange} />
      </Form.Group>
      {errorMessage ? (
        <h6
          className={"text-danger"}
          style={{ textAlign: "center", padding: 10 }}
        >
          {errorMessage}
        </h6>
      ) : (
        <></>
      )}
      <Button
        variant="outline-primary"
        type="submit"
        className="rounded-pill d-flex flex-column justify-content-center align-items-center w-100 registration-page__button"
        onClick={handleRegister}
      >
        Зарегистрироваться
      </Button>
    </Form>
  );
};

export default React.memo(AddEventForm);
