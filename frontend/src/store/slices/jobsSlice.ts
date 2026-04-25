import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Job } from '@/types';
import { apiClient } from '@/lib/api';

interface JobsState {
  list: Job[];
  selected: Job | null;
  loading: boolean;
  error: string | null;
}

const initialState: JobsState = { list: [], selected: null, loading: false, error: null };

export const fetchJobs = createAsyncThunk('jobs/fetch', async () => {
  const response = await apiClient.get('/jobs?status=active');
  return response.data.data as Job[];
});

export const createJob = createAsyncThunk('jobs/create', async (job: Partial<Job>, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('/jobs', job);
    return response.data.data as Job;
  } catch (err: unknown) {
    return rejectWithValue(err instanceof Error ? err.message : 'Failed to create job');
  }
});

export const deleteJob = createAsyncThunk('jobs/delete', async (id: string, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/jobs/${id}`);
    return id;
  } catch (err: unknown) {
    return rejectWithValue(err instanceof Error ? err.message : 'Failed to delete job');
  }
});

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    selectJob(state, action: PayloadAction<Job | null>) {
      state.selected = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => { state.loading = true; })
      .addCase(fetchJobs.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchJobs.rejected, (state) => { state.loading = false; })
      .addCase(createJob.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.list = state.list.filter((job) => job._id !== action.payload);
        if (state.selected?._id === action.payload) {
          state.selected = null;
        }
      });
  },
});

export const { selectJob } = jobsSlice.actions;
export default jobsSlice.reducer;
