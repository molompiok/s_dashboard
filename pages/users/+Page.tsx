
import React, { useState } from 'react';
import './+Page.css'

export default function Page() {
    

    return <div className="clients">
        <App/>
    </div>
}


import { FiSearch, FiUsers, FiBriefcase, FiTrendingUp, FiUsers as FiTeam, FiCalendar, FiBell, FiChevronRight, FiMenu } from 'react-icons/fi';
import { ClientList } from '../../Components/ClientList/ClientList';
import { Topbar } from '../../Components/TopBar/TopBar';

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const stats = [
    {
      title: 'Clients',
      count: 23,
      color: 'linear-gradient(135deg, #f5c6cb, #f3a5b1)',
      icon: <FiUsers />,
      users: [
        { name: 'John Doe', avatar: '#e6e6e6' },
        { name: 'Jane Smith', avatar: '#e6e6e6' },
        { name: 'Alex Brown', avatar: '#e6e6e6' },
      ],
      details: [
        { label: 'Nouveaux', value: '5' },
        { label: 'Actifs', value: '18' },
        { label: 'en ligne', value: '12' },
        { label: 'Satisfaction', value: '92%' },
      ],
    },
    {
      title: 'Collaborateurs',
      count: 17,
      color: 'linear-gradient(135deg, #c3cfe2, #a3bffa)',
      icon: <FiBriefcase />,
      users: [
        { name: 'Arlene McCoy', avatar: '#e6e6e6' },
        { name: 'Annette Black', avatar: '#e6e6e6' },
        { name: 'Robert Fox', avatar: '#e6e6e6' },
      ],
      details: [
        { label: 'En mission', value: '14' },
        { label: 'Disponibles', value: '3' },
        { label: 'Projets terminés', value: '45' },
        { label: 'Heures travaillées', value: '320h' },
      ],
    },
    // {
    //   title: 'Promoteurs',
    //   count: 12,
    //   color: 'linear-gradient(135deg, #f5e1a4, #f6d365)',
    //   icon: <FiTrendingUp />,
    //   users: [
    //     { name: 'Mark Wilson', avatar: '#e6e6e6' },
    //     { name: 'Sarah Lee', avatar: '#e6e6e6' },
    //     { name: 'Tom Harris', avatar: '#e6e6e6' },
    //   ],
    //   details: [
    //     { label: 'Investissements', value: '$150K' },
    //     { label: 'Projets soutenus', value: '8' },
    //     { label: 'Retour attendu', value: '15%' },
    //     { label: 'Engagements actifs', value: '5' },
    //   ],
    // },
    // {
    //   title: 'Équipes',
    //   count: 5,
    //   color: 'linear-gradient(135deg, #b5f5ec, #81e6d9)',
    //   icon: <FiTeam />,
    //   users: [
    //     { name: 'Team Alpha', avatar: '#e6e6e6' },
    //     { name: 'Team Beta', avatar: '#e6e6e6' },
    //     { name: 'Team Gamma', avatar: '#e6e6e6' },
    //   ],
    //   details: [
    //     { label: 'Membres moyens', value: '4' },
    //     { label: 'Projets actifs', value: '3' },
    //     { label: 'Tâches en cours', value: '25' },
    //     { label: 'Performance', value: '88%' },
    //   ],
    // },
  ];

  const tasks = [
    { title: 'Food concept', date: 'Mon', time: '13:00 PM' },
    { title: 'Landing page UI illustration', date: 'Wed', time: '10:00 AM' },
  ];

  const teamMembers = [
    { name: 'Arlene McCoy', role: 'UI Designer' },
    { name: 'Annette Black', role: 'Developer' },
    { name: 'Robert Fox', role: 'Analyst' },
    { name: 'Kathryn Murphy', role: 'UX Researcher' },
  ];

  const schedule = [
    { day: 'Sun', task: 'Makanyuk app', start: '09:00', end: '12:00', color: '#a3bffa' },
    { day: 'Mon', task: 'Food concept', start: '13:00', end: '15:00', color: '#f3a5b1' },
    { day: 'Wed', task: 'Website design', start: '10:00', end: '14:00', color: '#f6d365' },
  ];

  return (
    <div className="dashboard">
    <Topbar/>
      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <FiMenu className="menu-icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
            <h1>Tableau de Bord</h1>
          </div>
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Rechercher..." />
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card" style={{ background: stat.color }}>
              <div className="stat-header">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-title-count">
                  <h2>{stat.title}</h2>
                  <p className="stat-count">{stat.count}</p>
                </div>
              </div>
              <div className="stat-users">
                {stat.users.map((user, idx) => (
                  <div key={idx} className="user-avatar" style={{ backgroundColor: user.avatar }} title={user.name}></div>
                ))}
              </div>
              <div className="stat-details">
                {stat.details.map((detail, idx) => (
                  <div key={idx} className="detail-item">
                    <span className="detail-label">{detail.label}:</span>
                    <span className="detail-value">{detail.value}</span>
                  </div>
                ))}
              </div>
              <button className="view-all-btn" onClick={()=>{
                 window.location.assign(`/users/clients`)
              }}>Voir tout</button>
            </div>
          ))}
        </div>

        {/* Additional Sections */}
        <div className="additional-sections">
          {/* Team Members */}
          <div className="team-section">
            <h3>Membres de l'équipe</h3>
            <div className="team-list">
              {teamMembers.map((member, index) => (
                <div key={index} className="team-member">
                  <div className="avatar"></div>
                  <div>
                    <p className="member-name">{member.name}</p>
                    <a className="member-role">{member.role}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule */}
          {/* <div className="schedule-section">
            <h3>Planning</h3>
            <div className="schedule">
              {schedule.map((event, index) => (
                <div key={index} className="schedule-item">
                  <p>{event.day}</p>
                  <div className="schedule-task" style={{ backgroundColor: event.color }}>
                    <span>{event.task}</span>
                    <span>{event.start} - {event.end}</span>
                  </div>
                </div>
              ))}
            </div>
          </div> */}

          {/* Tasks */}
          {/* <div className="tasks-section">
            <h3>Aujourd'hui</h3>
            {tasks.map((task, index) => (
              <div key={index} className="task-item">
                <div>
                  <p className="task-title">{task.title}</p>
                  <p className="task-time">{task.date} • {task.time}</p>
                </div>
                <FiChevronRight className="task-arrow" />
              </div>
            ))}
          </div> */}
          
        </div>
      </div>
    </div>
  );
};
