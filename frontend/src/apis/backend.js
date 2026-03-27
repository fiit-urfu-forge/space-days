import { API_BASE_URL } from "../constants";
import { PutObjectCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { s3Client } from "s3Client.js";

export async function getEvent(id) {
    if (API_BASE_URL) {
        const response = await fetch(`${API_BASE_URL}/events/?id=${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (response.ok) {
            const result = await response.json();
            return result;
        } else {
            console.log("HTTP error: " + response.status);
            return null;
        }
    } else {
        return delay(1000).then(() => sampleByIdEvents);
    }
}

export async function getExportFile() {
    if (API_BASE_URL) {
        const response = await fetch(`${API_BASE_URL}/export/all`, {
            method: "GET",
        }).then(res => res.blob()).then(blob => {
            const url = window.URL.createObjectURL(new Blob([blob]),);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download",
                "spaceDaysExport.xlsx");
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        });
    }
}

export async function deleteEvent(id) {

    if (API_BASE_URL) {
        const response = await fetch(`${API_BASE_URL}/events/?event_id=${id}`, {
            method: "DELETE"
        });

        if (response.ok || response.status === 409 || response.status === 422) {
            return {
                ok: response.ok,
                status: response.status,
                body: await response.json()
            };
        } else {
            console.log("HTTP error: " + response.status);
            return {
                status: response.status
            };
        }
    } else {
        return delay(1000).then(() => ({
            ok: true,
            status: 200,
            body: sampleTicket
        }));
    }
}

export async function getEventsByDays(days) {
    if (API_BASE_URL) {
        const daysQuery = days.map(d => `days=${d}`).join('&');
        const response = await fetch(`${API_BASE_URL}/events/?${daysQuery}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const result = await response.json();
            return result;
        } else {
            console.log("HTTP error: " + response.status);
            return null;
        }
    } else {
        return delay(1000).then(() => sampleByDaysEvents);
    }
}

export async function getEvents() {
    if (API_BASE_URL) {
        const response = await fetch(`${API_BASE_URL}/events/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const result = await response.json();
            return result;
        } else {
            console.log("HTTP error: " + response.status);
            return null;
        }
    } else {
        return delay(1000).then(() => sampleByDaysEvents);
    }
}

export async function getEventsByHours(day, hours) {
    if (API_BASE_URL) {
        const hoursQuery = hours.map(d => `hours=${d}`).join('&');
        const response = await fetch(`${API_BASE_URL}/events/?days=${day}&${hoursQuery}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const result = await response.json();
            return result;
        } else {
            console.log("HTTP error: " + response.status);
            return null;
        }
    } else {
        return delay(1000).then(() => sampleByHoursEvents);
    }
}

export async function getMyTickets(phone, birthdate) {
    if (API_BASE_URL) {
        const response = await fetch(`${API_BASE_URL}/tickets/my`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                phone,
                birthdate
            })
        });

        if (response.ok || response.status === 409 || response.status === 422) {
            return {
                ok: response.ok,
                status: response.status,
                body: await response.json()
            };
        } else {
            console.log("HTTP error: " + response.status);
            return {
                status: response.status
            };
        }
    } else {
        return delay(1000).then(() => ({
            ok: true,
            status: 200,
            body: []
        }));
    }
}

export async function getPartners() {
    if (API_BASE_URL) {
        const response = await fetch(`${API_BASE_URL}/partners`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const result = await response.json();
            return result;
        } else {
            console.log("HTTP error: " + response.status);
            return null;
        }
    } else {
        return delay(1000).then(() => samplePartners);
    }
}

export async function addPartner(form, id) {

    if (API_BASE_URL) {
        const formData = new FormData();
        formData.append('partner_id', id ? id : form.file[0].name.substr(0, form.file[0].name.length - 4));
        formData.append("name", form.name);
        formData.append("link", form.link);

        const response = await fetch(`${API_BASE_URL}/partners?partner_id=${id ? id : form.file[0].name.substr(0, form.file[0].name.length - 4)}&name=${form.name}&link=${form.link}`, {
            method: id ? "PUT" : "POST",
        });

        if (response.ok || response.status === 409 || response.status === 422) {
            return {
                ok: response.ok,
                status: response.status,
                body: await response.json()
            };
        } else {
            console.log("HTTP error: " + response.status);
            return {
                status: response.status
            };
        }
    } else {
        return delay(1000).then(() => ({
            ok: true,
            status: 200,
            body: sampleTicket
        }));
    }
}

export async function deletePartner(id) {

    if (API_BASE_URL) {

        const response = await fetch(`${API_BASE_URL}/partners?partner_id=${id}`, {
            method: "DELETE"
        });

        if (response.ok || response.status === 409 || response.status === 422) {
            return {
                ok: response.ok,
                status: response.status,
                body: await response.json()
            };
        } else {
            console.log("HTTP error: " + response.status);
            return {
                status: response.status
            };
        }
    } else {
        return delay(1000).then(() => ({
            ok: true,
            status: 200,
            body: sampleTicket
        }));
    }
}

export async function getUsers() {
    if (API_BASE_URL) {
        const response = await fetch(`${API_BASE_URL}/admin`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const result = await response.json();
            return result;
        } else {
            console.log("HTTP error: " + response.status);
            return null;
        }
    } else {
        return delay(1000).then(() => samplePartners);
    }
}

export async function deleteAdmin(id) {

    if (API_BASE_URL) {

        const response = await fetch(`${API_BASE_URL}/admin?email=${id}`, {
            method: "DELETE"
        });

        if (response.ok || response.status === 409 || response.status === 422) {
            return {
                ok: response.ok,
                status: response.status,
                body: await response.json()
            };
        } else {
            console.log("HTTP error: " + response.status);
            return {
                status: response.status
            };
        }
    } else {
        return delay(1000).then(() => ({
            ok: true,
            status: 200,
            body: sampleTicket
        }));
    }
}

export async function addAdmin(form) {

    if (API_BASE_URL) {
        const response = await fetch(`${API_BASE_URL}/admin`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
        });

        if (response.ok || response.status === 409 || response.status === 422) {
            return {
                ok: response.ok,
                status: response.status,
                body: await response.json()
            };
        } else {
            console.log("HTTP error: " + response.status);
            return {
                status: response.status
            };
        }
    } else {
        return delay(1000).then(() => ({
            ok: true,
            status: 200,
            body: sampleTicket
        }));
    }
}

export async function transferAdmin(form) {
    if (API_BASE_URL) {
        const response = await fetch(`${API_BASE_URL}/admin/owner`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
        });

        if (response.ok || response.status === 409 || response.status === 422) {
            return {
                ok: response.ok,
                status: response.status,
                body: await response.json()
            };
        } else {
            console.log("HTTP error: " + response.status);
            return {
                status: response.status
            };
        }
    } else {
        return delay(1000).then(() => ({
            ok: true,
            status: 200,
            body: sampleTicket
        }));
    }
}

export async function addPartnerLogo(form, id) {
    const name = id ? `${id}.png` : form.file[0].name;

    const params = {
        Bucket: "space-days-staging", // Имя бакета, например 'sample-bucket-101'.
        Key: `image/partners/${name}`, // Имя объекта, например 'sample_upload.txt'.
        Body: form.file[0], // Содержимое объекта, например 'Hello world!".
        ACL: 'public-read',
    };

    try {
        const results = await s3Client.send(new PutObjectCommand(params));
        console.log(
            "Successfully created " +
            params.Key +
            " and uploaded it to " +
            params.Bucket +
            "/" +
            params.Key
        );
        return results; // Для модульного тестирования.
    } catch (err) {
        console.log("Error", err);
    }
}

export async function loadEvents(file, force = false) {
    const formData = new FormData();
    formData.append("file", file);
    if (API_BASE_URL) {
        const response = await fetch(`${API_BASE_URL}/events/xlsx`, {
            method: "POST",
            body: formData,
        });

        if (response.ok || response.status === 409 || response.status === 422) {
            return {
                ok: response.ok,
                status: response.status,
                body: await response.json()
            };
        } else {
            console.log("HTTP error: " + response.status);
            return {
                status: response.status
            };
        }
    } else {
        return delay(1000).then(() => ({
            ok: true,
            status: 200,
            body: sampleTicket
        }));
    }
}

export async function addEvent(form, force = false) {
    if (API_BASE_URL) {
        const body = {
            description: form.description,
            location: form.location,
            summary: form.summary,
            title: form.title,
            age: form.age,
            duration: form.duration,
            id_partner: form.id_partner,
            is_children: form.is_children,
            slots: form.slots.map((it) => ({
                start_time: `${form.date}T${it.start_time}:00Z`,
                amount: it.amount,
            })),
            force_registration: force,
        };

        const response = await fetch(`${API_BASE_URL}/event`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (response.ok || response.status === 409 || response.status === 422) {
            return {
                ok: response.ok,
                status: response.status,
                body: await response.json()
            };
        } else {
            console.log("HTTP error: " + response.status);
            return {
                status: response.status
            };
        }
    } else {
        return delay(1000).then(() => ({
            ok: true,
            status: 200,
            body: sampleTicket
        }));
    }
}

export async function subscribeEvent(slotId, form, force = false) {
    if (API_BASE_URL) {
        const body = {
            first_name: form.name,
            last_name: form.surname,
            phone: form.phone,
            birthdate: form.birthdate,
            email: form.email,
            child: form.hasChildren
                ? form.children.map((it) => ({
                    first_name: it.name,
                    age: it.age,
                }))
                : [],
            slot_id: slotId,
            force_registration: force,
        };

        if (!form.hasChildren) {
            delete body.child;
        }

        const response = await fetch(`${API_BASE_URL}/events/subscribe`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (response.ok || response.status === 409 || response.status === 422) {
            return {
                ok: response.ok,
                status: response.status,
                body: await response.json()
            };
        } else {
            console.log("HTTP error: " + response.status);
            return {
                status: response.status
            };
        }
    } else {
        return delay(1000).then(() => ({
            ok: true,
            status: 200,
            body: sampleTicket
        }));
    }
}

function delay(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}

const sampleByIdEvents = [
    {
        event_id: 1,
        description: "string",
        location: "matmex",
        summary: "круто",
        title: "мероприятие на матмехе",
        slots: [
            {
                slot_id: 1,
                start_time: "2023-11-02T16:00:01+00:00",
                end_time: "2023-11-01T16:00:01+00:00",
                amount: 0,
                available_users: -2,
            },
        ],
    },
];

const sampleByDaysEvents = [
    {
        event_id: 1,
        description: "string",
        location: "matmex",
        summary: "круто",
        title: "Мероприятие 8 апреля",
        slots: [
            {
                slot_id: 1,
                start_time: "2023-04-08T11:00:01+00:00",
                end_time: "2023-04-08T11:30:01+00:00",
                amount: 0,
                available_users: 5,
            },
            {
                slot_id: 2,
                start_time: "2023-04-08T12:00:01+00:00",
                end_time: "2023-04-08T12:30:01+00:00",
                amount: 0,
                available_users: 5,
            },
            {
                slot_id: 3,
                start_time: "2023-04-08T16:00:01+00:00",
                end_time: "2023-04-08T16:30:01+00:00",
                amount: 0,
                available_users: 5,
            },
        ],
    },
    {
        event_id: 2,
        description: "string",
        location: "matmex",
        summary: "еще круче",
        title: "Еще одно мероприятие",
        slots: [
            {
                slot_id: 4,
                start_time: "2023-04-08T16:00:01+00:00",
                end_time: "2023-04-08T16:30:01+00:00",
                amount: 0,
                available_users: 5,
            },
        ],
    },
];

const sampleByHoursEvents = [
    {
        event_id: 1,
        description: "string",
        location: "matmex",
        summary: "круто",
        title: "Мероприятие 8 апреля",
        slots: [
            {
                slot_id: 1,
                start_time: "2023-04-08T11:00:01+00:00",
                end_time: "2023-04-08T11:30:01+00:00",
                amount: 0,
                available_users: 5,
            }
        ],
    },
];


const sampleTicket = {
    ticket_id: 570311949,
    user_id: 2,
    slot_id: 1,
    amount: 0,
};

const samplePartners = [
    {
        "partner_id": "fiit",
        "name": "ФИИТ",
        "link": "https://fiit-urfu.ru/"
    },
    {
        "partner_id": "smartschool",
        "name": "Смарт Школа",
        "link": "https://smartschoolekb.ru",
    }
];
