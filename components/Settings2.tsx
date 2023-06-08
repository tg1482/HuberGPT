import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Menu } from "primereact/menu";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";

interface ActiveItem {
  title: string;
  content: string;
}

export const Settings2 = () => {
  const { data: session, status } = useSession();
  console.log("session", session);
  console.log("status", status);
  const [visible, setVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [credits, setCredits] = useState("");

  const items = [
    {
      label: "Login/Logout",
      command: () => {
        setActiveItem({ title: "Login/Logout", content: "Login/Logout content goes here..." });
        setVisible(true);
        setMenuVisible(false); // hide menu after click
      },
    },
    {
      label: "Profile",
      command: () => {
        setActiveItem({ title: "Profile", content: "Profile content goes here..." });
        setVisible(true);
        setMenuVisible(false); // hide menu after click
      },
    },
    {
      label: "Credits",
      command: () => {
        setActiveItem({ title: "Credits", content: "Credits content goes here..." });
        setVisible(true);
        setMenuVisible(false); // hide menu after click
      },
    },
  ];

  useEffect(() => {
    const handleOutsideClick = (e: any) => {
      if (!e.target.closest("#settings-button") && !e.target.closest("#popup_menu")) {
        setMenuVisible(false);
        // setVisible(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const onHide = () => setVisible(false);

  const renderFooter = (
    <div>
      <button onClick={onHide} className="p-button-text">
        Close
      </button>
    </div>
  );

  const renderLoginContent = () => (
    <div>
      <h3>Username:</h3>
      <InputText value={username} onChange={(e) => setUsername(e.target.value)} />
      <h3>Password:</h3>
      <InputText value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
    </div>
  );

  const renderProfileContent = () => (
    <div>
      <h3>Name:</h3>
      <InputText value={profileName} onChange={(e) => setProfileName(e.target.value)} />
      <h3>Bio:</h3>
      <InputText value={profileBio} onChange={(e) => setProfileBio(e.target.value)} />
    </div>
  );

  const renderCreditsContent = () => (
    <div>
      <h3>Credits:</h3>
      <InputText value={credits} onChange={(e) => setCredits(e.target.value)} />
    </div>
  );

  const renderContent = () => {
    switch (activeItem?.title) {
      case "Login/Logout":
        return renderLoginContent();
      case "Profile":
        return renderProfileContent();
      case "Credits":
        return renderCreditsContent();
      default:
        return <p>{activeItem?.content}</p>;
    }
  };

  return (
    <div className="relative">
      <button id="settings-button" className="p-button p-component" onClick={() => setMenuVisible(!menuVisible)}>
        <i className="pi pi-cog text-lg"></i>
      </button>
      {menuVisible && (
        <div className="absolute top-full z-10 right-0">
          <Menu model={items} id="popup_menu" />
        </div>
      )}
      <Dialog header={activeItem?.title} visible={visible} style={{ width: "50vw" }} footer={renderFooter} onHide={onHide}>
        {renderContent()}
      </Dialog>
    </div>
  );
};
