// src/pages/AllCommentsPage.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowRight, FaEye } from 'react-icons/fa';
import { fetchMyComments, fetchMyReactions } from '../redux/slices/postsSlice';
import Heading from '../components/Shared/Heading';

const AllCommentsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myComments, myReactions } = useSelector(state => state.posts);
  const [localComments, setLocalComments] = useState([]);

  useEffect(() => {
    dispatch(fetchMyComments({ perPage: 100 }));
    dispatch(fetchMyReactions({ perPage: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (myComments.data) {
      const reactionMap = {};
      if (myReactions.data) {
        myReactions.data.forEach(r => {
          if (r.reactionable_type === 'Comment') {
            reactionMap[r.reactionable_id] = r.type;
          }
        });
      }
      const enriched = myComments.data.map(c => ({
        ...c,
        user_reaction: reactionMap[c.id] || c.user_reaction || null,
      }));
      setLocalComments(enriched);
    }
  }, [myComments.data, myReactions.data]);

  const goToArticle = (articleId) => {
    if (articleId) navigate(`/post/${articleId}`);
  };

  if (myComments.loading && localComments.length === 0) {
    return <div className="flex justify-center p-10"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Heading title="جميع تعليقاتي" subtitle="جميع التعليقات التي كتبتها على المقالات" />
        <Link to="/my-comments" className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200 transition">
          <FaArrowRight /> رجوع
        </Link>
      </div>

      {localComments.length === 0 ? (
        <p className="text-gray-500 text-center">لا توجد تعليقات</p>
      ) : (
        <div className="space-y-3">
          {localComments.map(comment => (
            <div
              key={comment.id}
              className="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => goToArticle(comment.on?.id || comment.article_id)}
            >
              <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
              <div className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                <span>في مقال: <span className="font-medium">{comment.on?.title || `#${comment.on?.id}`}</span></span>
                <span>•</span>
                <span>{new Date(comment.created_at).toLocaleDateString('ar-EG')}</span>
                <span className="flex items-center gap-1 text-primary"><FaEye className="text-[10px]" /> اضغط للعرض</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllCommentsPage;