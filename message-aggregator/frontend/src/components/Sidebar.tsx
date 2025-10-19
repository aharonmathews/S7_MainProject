import React from 'react';

const Sidebar: React.FC = () => {
    return (
        <div className="sidebar">
            <h2>Message Aggregator</h2>
            <nav>
                <ul>
                    <li><a href="#messages">Messages</a></li>
                    <li><a href="#platforms">Platforms</a></li>
                    <li><a href="#settings">Settings</a></li>
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;