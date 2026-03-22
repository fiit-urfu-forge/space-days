// @ts-nocheck
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import styles from "./styles.module.css";
import React from "react";
import { useEffect, useState } from "react";
import classnames from "classnames";
import { getPartners, deletePartner } from "apis/backend";
import { PartnerForm } from "./partnerForm";
import { EditButton } from "components/buttons/edit-button";
import { DeleteButton } from "components/buttons/delete-button";
import { useLoaderData, useNavigation } from "react-router-dom";
import { BASE_URL } from "constants";
import { AdminLoader } from "components/loaders/admin-loader";

export const partnersLoader = async () => {
  const res = await getPartners();
  return res;
}

export const PartnersPage = () => {
  const navigation = useNavigation();
  const handleDelete = async (element_id) => {
    const result = await deletePartner(element_id);
    if (result.ok) {

      const fetchData = async () => {
        const partnersList = await getPartners();
        setPartnersList(partnersList);
      }

      fetchData();
      ;
    };
  };

  const [modalActive, setModalActive] = useState(false);
  const [editModalActive, setEditModalActive] = useState(false);
  const [partnersList, setPartnersList] = useState([]);
  const [partner, setPartner] = useState(useLoaderData());
  useEffect(() => {
    const fetchData = async () => {
      const partnersList = await getPartners();
      setPartnersList(partnersList);
    }

    fetchData();
  }, []);

  const partnersTable = <div className={styles.table}>
    <div className={classnames(styles.row, styles.titles)}>
      <h3>Лого</h3>
      <h3>Название</h3>
      <h3>Ссылка</h3>
    </div>
    {partnersList.map(partner => {
      let pr = async () => {
        let res = await fetch(`${BASE_URL}/image/partners/${partner.partner_id}.png`)
          .then(response => {
            if (response.ok) {
              return `${BASE_URL}/image/partners/${partner.partner_id}.png`;
            }
            else {
              return `${BASE_URL}/image/partners/default.png`;
            }
          })
        imgSrc = res;
        return imgSrc;
      };
      return (
        <div className={styles.row} id={partner.partner_id} key={partner.partner_id}>
          <Image src={`${BASE_URL}/image/partners/${partner.partner_id}.png`} onError={({ currentTarget }) => {
            currentTarget.onerror = null;
            currentTarget.src = `${BASE_URL}/image/partners/default.png`;
          }} className={styles.logo} />
          <span>{partner.name}</span>
          <a href={partner.link}>
            {partner.link}
          </a>
          <div className={styles.buttons}>
            <EditButton elem={partner} onClickHandler={() => {
              setEditModalActive(true);
              setPartner(partner);
            }} />
            <DeleteButton element_id={partner.partner_id} deleteHandle={handleDelete} list={partnersList} updateList={setPartnersList} />
          </div>
        </div>)
    })}
  </div>

  return (
    <>
      <PartnerForm title="Добавить партнёра" buttonTitle="Добавить" active={modalActive} setActive={setModalActive} updateList={setPartnersList} />
      <PartnerForm elem={partner} title="Редактирование" buttonTitle="Сохранить" active={editModalActive} setActive={setEditModalActive} updateList={setPartnersList} />
      <h1>Партнёры</h1>
      <hr className={styles.hr} />
      <Button
        className={classnames("outline-primary", styles.addButton)}
        variant="outline-primary"
        onClick={() => setModalActive(true)}
      >
        Добавить партнёра
      </Button>
      {navigation.state === "loading" ? <AdminLoader /> : partnersTable}
    </>
  )
};
