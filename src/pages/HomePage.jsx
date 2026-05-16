import React from 'react';
import Hero from '../components/Hero/Hero';
import EmergencyPage from './EmergencyPage';
import PostsPage from './PostsPage';
import CoursesPage from './CoursesPage';
import MarketplacePage from './MarketplacePage';

const HomePage = () => {
    return (
        <div>
            <section id="home"><Hero /></section>
            <section id="emergency"><EmergencyPage /></section>
            <section id="posts"><PostsPage /></section>
            <section id="courses"><CoursesPage /></section>
            <section id="marketplace"><MarketplacePage /></section>
        </div>
    );
};

export default HomePage;