import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Heading from '../components/Shared/Heading';
import PostCard from '../components/Posts/PostCard';
import PostFilters from '../components/Posts/PostFilters';
import CreatePostModal from './../components/Posts/CreatePostModel';
import Button from '../components/Shared/Button';
import { FaPlus } from 'react-icons/fa';

const PostsPage = () => {
  const { t } = useTranslation();
  const { posts, filter, category } = useSelector(state => state.posts);
  const { currentUser } = useSelector(state => state.user);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let result = [...posts];

    // تصفية حسب التصنيف
    if (category !== 'all') {
      result = result.filter(p => p.category === category);
    }

    // ترتيب حسب الفلتر
    
    switch (filter) {
        case 'trending':
        result.sort((a, b) => (b.likes + b.comments?.length) - (a.likes + a.comments?.length));
        break;
      case 'mostLiked':
        result.sort((a, b) => b.likes - a.likes);
        break;
      case 'mostCommented':
        result.sort((a, b) => (b.comments?.length ||  0) - (a.comments?.length || 0));
        break;
      default:
        result.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        break;
    }

    setFilteredPosts(result);
  }, [posts, filter, category]);

  return (
    <div className="container my-10">
      <Heading 
        title={t('posts.title')} 
        subtitle={t('posts.subtitle')} 
      />

      {/* زر إنشاء مقال جديد */}
      {currentUser && (
        <div className="flex justify-end mb-6">
          <Button
            text={t('posts.createPost')}
            bgColor="bg-primary"
            textColor="text-white"
            handler={() => setIsModalOpen(true)}
            icon={<FaPlus className="inline mr-2" />}
          />
        </div>
      )}

      {/* الفلاتر */}
      <PostFilters />

      {/* عرض المنشورات */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500 dark:text-gray-400">{t('posts.noPosts')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>
      )}

      {/* Modal إنشاء مقال */}
      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default PostsPage;